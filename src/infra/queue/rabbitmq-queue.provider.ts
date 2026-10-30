import { inject, injectable } from 'tsyringe';
import { ChannelModel, ConfirmChannel, ConsumeMessage, connect } from 'amqplib';
import {
  ConsumeOptions,
  IQueueConsumer,
  IQueueProvider,
} from '@/infra/queue/queue-provider.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { env } from '@/shared/environment/env';

const EXCHANGE_TYPE = 'topic';

const PUBLISH_ATTEMPTS = 3;

const PUBLISH_BASE_DELAY_MS = 200;

const RETRY_COUNT_HEADER = 'x-retry-count';

const ROUTING_KEY_HEADER = 'x-routing-key';

@injectable()
export class RabbitMQQueueProvider implements IQueueProvider {
  private connection: Promise<ChannelModel> | null = null;
  private publisherChannel: Promise<ConfirmChannel> | null = null;
  private logger: ILogger;

  constructor(@inject('ILogger') logger: ILogger) {
    this.logger = logger.child('RabbitMQQueueProvider');
  }

  async publish(queue: string, data: unknown): Promise<void> {
    await this.publishWithRetry({ queue }, data, async (channel, content) => {
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, content, { persistent: true });
    });
  }

  async publishExchange(exchange: string, routingKey: string, data: unknown): Promise<void> {
    await this.publishWithRetry({ exchange, routingKey }, data, async (channel, content) => {
      await channel.assertExchange(exchange, EXCHANGE_TYPE, { durable: true });
      channel.publish(exchange, routingKey, content, { persistent: true });
    });
  }

  async consume<T>(
    queue: string,
    consumer: IQueueConsumer<T>,
    options: ConsumeOptions,
  ): Promise<string> {
    const { prefetch, durable, noAck, retry } = options;
    const channel = await (await this.getConnection()).createChannel();

    channel.on('close', () => this.logger.warn('Consumer channel closed'));
    channel.on('error', (error) => this.logger.error('Consumer channel error', { error }));
    await channel.prefetch(prefetch);

    await channel.assertQueue(queue, { durable });

    if (retry) {
      await channel.assertQueue(`${queue}.dlq`, { durable: true });
      await channel.assertQueue(`${queue}.retry`, {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: queue,
        messageTtl: retry.delayMs,
      });
    }

    const receive = async (message: ConsumeMessage) => {
      const headers = message.properties.headers ?? {};
      const attempt = Number(headers[RETRY_COUNT_HEADER] ?? 0) + 1;
      const routingKey = String(headers[ROUTING_KEY_HEADER] ?? message.fields.routingKey);

      try {
        const data: T = JSON.parse(message.content.toString());

        await consumer.consume({ data, routingKey, attempt });
      } catch (error) {
        const target = retry && (attempt < retry.maxAttempts ? 'retry' : 'dlq');

        this.logger[target === 'retry' ? 'warn' : 'error'](
          `Failed to consume (attempt ${attempt})`,
          {
            queue,
            target: target ?? 'discarded',
            content: message.content.toString(),
            error,
          },
        );

        if (target) {
          channel.sendToQueue(`${queue}.${target}`, message.content, {
            persistent: true,
            headers: {
              ...headers,
              [RETRY_COUNT_HEADER]: attempt,
              [ROUTING_KEY_HEADER]: routingKey,
            },
          });
        }
      }

      if (!noAck) {
        channel.ack(message);
      }
    };

    await channel.consume(
      queue,
      (message) => {
        if (message) {
          receive(message).catch((error) =>
            this.logger.error('Failed to settle message', { queue, error }),
          );
        }
      },
      { noAck },
    );

    this.logger.info('Consumer started', { queue });

    return queue;
  }

  async consumeExchange<T>(
    exchange: string,
    routingKey: string,
    queue: string,
    consumer: IQueueConsumer<T>,
    options: ConsumeOptions,
  ): Promise<string> {
    const channel = await (await this.getConnection()).createChannel();

    await channel.assertExchange(exchange, EXCHANGE_TYPE, { durable: true });
    await channel.assertQueue(queue, { durable: options.durable });
    await channel.bindQueue(queue, exchange, routingKey);
    await channel.close();

    return this.consume(queue, consumer, options);
  }

  async close(): Promise<void> {
    const connection = this.connection;

    this.connection = null;
    this.publisherChannel = null;

    if (connection) {
      await (await connection).close();
    }
  }

  private getConnection(): Promise<ChannelModel> {
    this.connection ??= connect({
      hostname: env.RABBITMQ_HOST,
      port: env.RABBITMQ_PORT,
      username: env.RABBITMQ_USER,
      password: env.RABBITMQ_PASS,
    })
      .then((connection) => {
        connection.on('close', () => {
          this.logger.warn('Connection closed');
          this.connection = null;
          this.publisherChannel = null;
        });
        connection.on('error', (error) => this.logger.error('Connection error', { error }));
        this.logger.info('Connected');

        return connection;
      })
      .catch((error) => {
        this.connection = null;
        throw error;
      });

    return this.connection;
  }

  private getPublisherChannel(): Promise<ConfirmChannel> {
    this.publisherChannel ??= this.getConnection()
      .then((connection) => connection.createConfirmChannel())
      .then((channel) => {
        channel.on('close', () => {
          this.publisherChannel = null;
        });
        channel.on('error', (error) => this.logger.error('Publisher channel error', { error }));

        return channel;
      })
      .catch((error) => {
        this.publisherChannel = null;
        throw error;
      });

    return this.publisherChannel;
  }

  private async publishWithRetry(
    target: Record<string, string>,
    data: unknown,
    send: (channel: ConfirmChannel, content: Buffer) => Promise<void>,
  ): Promise<void> {
    const content = Buffer.from(JSON.stringify(data));

    for (let attempt = 1; ; attempt++) {
      try {
        const channel = await this.getPublisherChannel();
        await send(channel, content);
        await channel.waitForConfirms();

        return;
      } catch (error) {
        this.logger.error(`Failed to publish (attempt ${attempt}/${PUBLISH_ATTEMPTS})`, {
          ...target,
          error,
        });
        this.publisherChannel = null;

        if (attempt === PUBLISH_ATTEMPTS) {
          throw error;
        }

        await sleep(PUBLISH_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
