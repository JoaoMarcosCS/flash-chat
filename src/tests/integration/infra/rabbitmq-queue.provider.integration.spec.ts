import { afterAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { connect, GetMessage } from 'amqplib';
import { RabbitMQQueueProvider } from '@/infra/queue/rabbitmq-queue.provider';
import { IQueueConsumer, QueueMessage } from '@/infra/queue/queue-provider.interface';
import { logger } from '@/infra/logger';
import { env } from '@/shared/environment/env';

class RecordingConsumer implements IQueueConsumer {
  messages: QueueMessage<unknown>[] = [];

  constructor(private failures = 0) {}

  async consume(message: QueueMessage<unknown>): Promise<void> {
    this.messages.push(message);

    if (this.messages.length <= this.failures) {
      throw new Error('transient failure');
    }
  }
}

const unique = (name: string) => `${name}.${uuidv7()}`;

const waitFor = async <T>(read: () => Promise<T | false | null> | T | false | null) => {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    const value = await read();

    if (value) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Timed out waiting for condition');
};

const openRawChannel = async () => {
  const connection = await connect({
    hostname: env.RABBITMQ_HOST,
    port: env.RABBITMQ_PORT,
    username: env.RABBITMQ_USER,
    password: env.RABBITMQ_PASS,
  });

  return { channel: await connection.createConfirmChannel(), close: () => connection.close() };
};

const getFrom = async (queue: string) => {
  const raw = await openRawChannel();

  try {
    return await waitFor(
      () => raw.channel.get(queue, { noAck: true }) as Promise<GetMessage | false>,
    );
  } finally {
    await raw.close();
  }
};

const retry = { delayMs: 100, maxAttempts: 3 };

describe('RabbitMQQueueProvider (integração)', () => {
  const provider = new RabbitMQQueueProvider(logger);

  afterAll(async () => {
    await provider.close();
  });

  it('should route by routing key and deliver everything to an exclusive # queue', async () => {
    const exchange = unique('events');
    const persist = new RecordingConsumer();
    const delivery = new RecordingConsumer();

    await provider.consumeExchange(exchange, 'message.published', unique('persist'), persist);
    const exclusive = await provider.consumeExchange(exchange, '#', '', delivery, {
      exclusive: true,
    });

    await provider.publishExchange(exchange, 'message.published', { id: 1 });
    await provider.publishExchange(exchange, 'chat.created', { id: 2 });

    await waitFor(() => delivery.messages.length === 2 && persist.messages.length === 1);

    expect(persist.messages).toEqual([
      { data: { id: 1 }, routingKey: 'message.published', attempt: 1 },
    ]);
    expect(delivery.messages.map(({ routingKey }) => routingKey)).toEqual([
      'message.published',
      'chat.created',
    ]);
    expect(exclusive).toMatch(/^amq\.gen-/);
  });

  it('should publish to a queue and consume it', async () => {
    const queue = unique('direct');
    const consumer = new RecordingConsumer();

    await provider.consume(queue, consumer);
    await provider.publish(queue, { id: 1 });

    await waitFor(() => consumer.messages.length === 1);

    expect(consumer.messages[0]).toEqual({ data: { id: 1 }, routingKey: queue, attempt: 1 });
  });

  it('should retry keeping the routing key and move to the DLQ after max attempts', async () => {
    const exchange = unique('events');
    const queue = unique('persist');
    const consumer = new RecordingConsumer(Infinity);

    await provider.consumeExchange(exchange, 'message.published', queue, consumer, { retry });
    await provider.publishExchange(exchange, 'message.published', { id: 1 });

    const dead = await getFrom(`${queue}.dlq`);

    expect(consumer.messages.map(({ attempt, routingKey }) => [attempt, routingKey])).toEqual([
      [1, 'message.published'],
      [2, 'message.published'],
      [3, 'message.published'],
    ]);
    expect(JSON.parse(dead.content.toString())).toEqual({ id: 1 });
    expect(dead.properties.headers).toMatchObject({
      'x-retry-count': 2,
      'x-failure-reason': 'max-attempts',
    });
  });

  it('should succeed on a retry without reaching the DLQ', async () => {
    const exchange = unique('events');
    const queue = unique('persist');
    const consumer = new RecordingConsumer(1);

    await provider.consumeExchange(exchange, 'message.published', queue, consumer, { retry });
    await provider.publishExchange(exchange, 'message.published', { id: 1 });

    await waitFor(() => consumer.messages.length === 2);

    const raw = await openRawChannel();
    const { messageCount } = await raw.channel.checkQueue(`${queue}.dlq`);
    await raw.close();

    expect(messageCount).toBe(0);
  });

  it('should move an invalid payload straight to the DLQ without consuming it', async () => {
    const exchange = unique('events');
    const queue = unique('persist');
    const consumer = new RecordingConsumer();

    await provider.consumeExchange(exchange, 'message.published', queue, consumer, { retry });

    const raw = await openRawChannel();
    raw.channel.publish(exchange, 'message.published', Buffer.from('{invalid'));
    await raw.channel.waitForConfirms();
    await raw.close();

    const dead = await getFrom(`${queue}.dlq`);

    expect(consumer.messages).toEqual([]);
    expect(dead.content.toString()).toBe('{invalid');
    expect(dead.properties.headers).toMatchObject({ 'x-failure-reason': 'invalid-payload' });
  });

  it('should discard a failed message when there is no retry', async () => {
    const queue = unique('direct');
    const consumer = new RecordingConsumer(1);

    await provider.consume(queue, consumer);
    await provider.publish(queue, { id: 1 });
    await provider.publish(queue, { id: 2 });

    await waitFor(() => consumer.messages.length === 2);

    expect(consumer.messages.map(({ data }) => data)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should open a single connection for concurrent first calls', async () => {
    const fresh = new RabbitMQQueueProvider(logger);
    const queue = unique('direct');

    await Promise.all([fresh.publish(queue, { id: 1 }), fresh.publish(queue, { id: 2 })]);

    expect(await (fresh as unknown as { connection: Promise<unknown> }).connection).toBeTruthy();
    await fresh.close();
  });
});
