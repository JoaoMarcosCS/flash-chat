import { Channel, ConfirmChannel, ConsumeMessage } from 'amqplib';
import { logger as baseLogger } from '@/infra/logger';
import { RabbitMQConnection } from './rabbitmq-connection.singleton';

const logger = baseLogger.child('Queue');

const PUBLISH_MAX_ATTEMPTS = 3;

const PUBLISH_BASE_DELAY_MS = 200;

const CONSUME_MAX_ATTEMPTS = 3;

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  noAck?: boolean;
  prefetch?: number;
  retryDelay?: number;
  maxAttempts?: number;
}

export type QueueCallback = (data: unknown, msg: ConsumeMessage, channel: Channel) => Promise<void>;

export abstract class Queue {
  protected static publisherChannel: ConfirmChannel | null;
  protected static consumerChannel: Channel | null;

  static async getPublisherChannel(): Promise<ConfirmChannel> {
    if (!this.publisherChannel) {
      const connection = await RabbitMQConnection.getInstance();
      this.publisherChannel = await connection.getConnection().createConfirmChannel();

      this.publisherChannel.on('close', () => {
        logger.warn('Publisher channel closed, will reconnect on next publish');
        this.publisherChannel = null;
      });

      this.publisherChannel.on('error', (error) => {
        logger.error('Publisher channel error', { error });
        this.publisherChannel = null;
      });

      logger.info('Publisher channel created successfully with confirmations enabled');
    }

    return this.publisherChannel;
  }

  static async publishQueue(queue: string, message: unknown) {
    await this.publishWithRetry({ queue }, message, async (channel, content) => {
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, content, { persistent: true });
    });
  }

  static async publishExchange(exchange: string, routingKey: string, message: unknown) {
    await this.publishWithRetry({ exchange, routingKey }, message, async (channel, content) => {
      await channel.assertExchange(exchange, 'topic', { durable: true });
      channel.publish(exchange, routingKey, content, { persistent: true });
    });
  }

  private static async publishWithRetry(
    target: Record<string, string>,
    message: unknown,
    send: (channel: ConfirmChannel, content: Buffer) => Promise<void>,
  ) {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= PUBLISH_MAX_ATTEMPTS; attempt++) {
      try {
        const channel = await this.getPublisherChannel();
        const content = Buffer.from(JSON.stringify(message));

        await send(channel, content);
        await channel.waitForConfirms();

        logger.info('Message published and confirmed successfully', {
          ...target,
          messageSize: content.length,
        });
        return;
      } catch (error) {
        lastError = error as Error;
        logger.error(`Failed to publish message (attempt ${attempt}/${PUBLISH_MAX_ATTEMPTS})`, {
          ...target,
          error,
        });

        this.publisherChannel = null;

        if (attempt < PUBLISH_MAX_ATTEMPTS) {
          const delayMs = PUBLISH_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    logger.error('All publish attempts failed, message lost', { ...target, error: lastError });
    throw new Error(
      `Failed to publish message to ${Object.values(target).join(':')} after ${PUBLISH_MAX_ATTEMPTS} attempts: ${lastError?.message}`,
    );
  }

  protected static async getConsumerChannel(prefetch?: number): Promise<Channel> {
    if (!this.consumerChannel) {
      const connection = await RabbitMQConnection.getInstance();
      this.consumerChannel = await connection.getConnection().createChannel();
      await this.consumerChannel.prefetch(prefetch ?? 1);

      this.consumerChannel.on('close', () => {
        logger.warn('Consumer channel closed, will reconnect on next consume');
        this.consumerChannel = null;
      });

      this.consumerChannel.on('error', (error) => {
        logger.error('Consumer channel error', { error });
        this.consumerChannel = null;
      });

      logger.info('Consumer channel created successfully');
    }

    return this.consumerChannel;
  }

  protected static async assertQueue(queue: string, options: QueueOptions = {}) {
    const channel = await this.getConsumerChannel(options.prefetch ?? 1);
    await channel.assertQueue(queue, options);
  }

  protected static async setupDLQ(originalQueue: string, retryDelay: number): Promise<void> {
    const channel = await this.getConsumerChannel();

    await channel.assertQueue(`${originalQueue}.dlq`, { durable: true });

    await channel.assertQueue(`${originalQueue}.retry`, {
      durable: true,
      deadLetterExchange: '',
      deadLetterRoutingKey: originalQueue,
      messageTtl: retryDelay,
    });
  }

  protected static async consume(
    queue: string,
    callback: QueueCallback,
    options: QueueOptions = {},
  ): Promise<string> {
    const channel = await this.getConsumerChannel(options.prefetch ?? 1);
    await channel.assertQueue(queue, options);

    if (options.retryDelay) {
      await this.setupDLQ(queue, options.retryDelay);
    }

    await this.startConsuming(channel, queue, callback, options);

    return queue;
  }

  protected static async consumeExchange(
    exchange: string,
    routingKey: string,
    queueName: string,
    callback: QueueCallback,
    options: QueueOptions = {},
  ): Promise<string> {
    const channel = await this.getConsumerChannel(options.prefetch ?? 1);

    await channel.assertExchange(exchange, 'topic', { durable: true });

    const { queue } = await channel.assertQueue(queueName, {
      durable: options.exclusive ? false : (options.durable ?? true),
      exclusive: options.exclusive ?? false,
    });

    await channel.bindQueue(queue, exchange, routingKey);

    if (options.retryDelay) {
      await this.setupDLQ(queue, options.retryDelay);
    }

    await this.startConsuming(channel, queue, callback, options);

    return queue;
  }

  private static async startConsuming(
    channel: Channel,
    queue: string,
    callback: QueueCallback,
    options: QueueOptions,
  ) {
    await channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        let payload: unknown;

        try {
          payload = JSON.parse(msg.content.toString());
        } catch (error) {
          logger.error('Invalid payload, message not processed', {
            queue,
            error,
            content: msg.content.toString(),
          });
          this.moveToDLQ(channel, queue, msg, options, 'invalid-payload');
          return;
        }

        try {
          await callback(payload, msg, channel);

          if (!options.noAck) {
            channel.ack(msg);
          }
        } catch (error) {
          this.handleFailure(channel, queue, msg, payload, options, error);
        }
      },
      { noAck: !!options.noAck },
    );
  }

  private static handleFailure(
    channel: Channel,
    queue: string,
    msg: ConsumeMessage,
    payload: unknown,
    options: QueueOptions,
    error: unknown,
  ) {
    const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) as number;
    const maxAttempts = options.maxAttempts || CONSUME_MAX_ATTEMPTS;

    if (!options.retryDelay) {
      logger.error('Failed to process message without retry, message discarded', {
        queue,
        payload,
        error,
      });

      if (!options.noAck) {
        channel.ack(msg);
      }
      return;
    }

    if (retryCount + 1 < maxAttempts) {
      logger.warn(`Failed to process message (attempt ${retryCount + 1}/${maxAttempts})`, {
        queue,
        error,
      });

      channel.sendToQueue(`${queue}.retry`, msg.content, {
        persistent: true,
        headers: {
          ...msg.properties.headers,
          'x-retry-count': retryCount + 1,
          'x-first-death-queue': queue,
          'x-first-death-reason': 'rejected',
        },
      });

      if (!options.noAck) {
        channel.ack(msg);
      }
      return;
    }

    logger.error('All attempts failed, moving message to DLQ', { queue, payload, error });
    this.moveToDLQ(channel, queue, msg, options, 'max-attempts');
  }

  private static moveToDLQ(
    channel: Channel,
    queue: string,
    msg: ConsumeMessage,
    options: QueueOptions,
    reason: string,
  ) {
    if (!options.retryDelay) {
      if (!options.noAck) {
        channel.ack(msg);
      }
      return;
    }

    const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) as number;

    channel.sendToQueue(`${queue}.dlq`, msg.content, {
      persistent: true,
      headers: {
        ...msg.properties.headers,
        'x-retry-count': retryCount,
        'x-final-failure': true,
        'x-failure-reason': reason,
        'x-failed-at': new Date().toISOString(),
      },
    });

    if (!options.noAck) {
      channel.ack(msg);
    }
  }

  abstract startConsumer(): Promise<void>;
}
