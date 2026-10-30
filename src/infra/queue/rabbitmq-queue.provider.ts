import { inject, injectable } from 'tsyringe';
import { Channel, ChannelModel, ConfirmChannel, ConsumeMessage, connect } from 'amqplib';
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
    return this.subscribe(consumer, options, async (channel) => {
      const declared = await channel.assertQueue(queue, queueArguments(options));

      return declared.queue;
    });
  }

  async consumeExchange<T>(
    exchange: string,
    routingKey: string,
    queue: string,
    consumer: IQueueConsumer<T>,
    options: ConsumeOptions,
  ): Promise<string> {
    return this.subscribe(consumer, options, async (channel) => {
      await channel.assertExchange(exchange, EXCHANGE_TYPE, { durable: true });
      const declared = await channel.assertQueue(queue, queueArguments(options));
      await channel.bindQueue(declared.queue, exchange, routingKey);

      return declared.queue;
    });
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

  private async subscribe<T>(
    consumer: IQueueConsumer<T>,
    settings: ConsumeOptions,
    declare: (channel: Channel) => Promise<string>,
  ): Promise<string> {
    const channel = await (await this.getConnection()).createChannel();

    channel.on('close', () => this.logger.warn('Consumer channel closed'));
    channel.on('error', (error) => this.logger.error('Consumer channel error', { error }));
    await channel.prefetch(settings.prefetch);

    const queue = await declare(channel);

    if (settings.retry) {
      await channel.assertQueue(`${queue}.dlq`, { durable: true });
      await channel.assertQueue(`${queue}.retry`, {
        durable: true,
        deadLetterExchange: '',
        deadLetterRoutingKey: queue,
        messageTtl: settings.retry.delayMs,
      });
    }

    await channel.consume(
      queue,
      (message) => {
        if (!message) return;

        this.handle(channel, queue, message, consumer, settings).catch((error) =>
          this.logger.error('Failed to settle message', { queue, error }),
        );
      },
      { noAck: settings.noAck },
    );

    this.logger.info('Consumer started', { queue });

    return queue;
  }

  private async handle<T>(
    channel: Channel,
    queue: string,
    message: ConsumeMessage,
    consumer: IQueueConsumer<T>,
    settings: ConsumeOptions,
  ): Promise<void> {
    const headers = message.properties.headers ?? {};
    const attempt = Number(headers[RETRY_COUNT_HEADER] ?? 0) + 1;
    const routingKey = String(headers[ROUTING_KEY_HEADER] ?? message.fields.routingKey);
    let data: T;

    try {
      data = JSON.parse(message.content.toString());
    } catch (error) {
      this.logger.error('Invalid payload', { queue, error });
      this.deadLetter(channel, queue, message, settings, 'invalid-payload');
      return;
    }

    try {
      await consumer.consume({ data, routingKey, attempt });
    } catch (error) {
      if (settings.retry && attempt < settings.retry.maxAttempts) {
        this.logger.warn(`Failed to consume (attempt ${attempt}/${settings.retry.maxAttempts})`, {
          queue,
          error,
        });
        channel.sendToQueue(`${queue}.retry`, message.content, {
          persistent: true,
          headers: { ...headers, [RETRY_COUNT_HEADER]: attempt, [ROUTING_KEY_HEADER]: routingKey },
        });
      } else {
        this.logger.error('Failed to consume, no attempts left', { queue, data, error });
        this.deadLetter(channel, queue, message, settings, 'max-attempts');
        return;
      }
    }

    if (!settings.noAck) {
      channel.ack(message);
    }
  }

  private deadLetter(
    channel: Channel,
    queue: string,
    message: ConsumeMessage,
    settings: ConsumeOptions,
    reason: string,
  ): void {
    if (settings.retry) {
      channel.sendToQueue(`${queue}.dlq`, message.content, {
        persistent: true,
        headers: {
          ...message.properties.headers,
          'x-failure-reason': reason,
          'x-failed-at': new Date().toISOString(),
        },
      });
    }

    if (!settings.noAck) {
      channel.ack(message);
    }
  }
}

const queueArguments = ({ durable, exclusive }: ConsumeOptions) => ({ durable, exclusive });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
