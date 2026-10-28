import { afterAll, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { Channel, GetMessage } from 'amqplib';
import { Queue, QueueOptions } from '@/infra/queue/queue.provider';
import { RabbitMQConnection } from '@/infra/queue/rabbitmq-connection.singleton';

type Handler = (data: unknown) => Promise<void>;

class TestConsumer extends Queue {
  queue = '';

  constructor(
    private exchange: string,
    private routingKey: string,
    private queueName: string,
    private handler: Handler,
    private options: QueueOptions = {},
  ) {
    super();
  }

  async startConsumer(): Promise<void> {
    this.queue = await TestConsumer.consumeExchange(
      this.exchange,
      this.routingKey,
      this.queueName,
      (data) => this.handler(data),
      this.options,
    );
  }
}

const unique = (name: string) => `${name}.${uuidv7()}`;

const waitFor = async <T>(read: () => Promise<T | false | null>, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await read();

    if (value) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Timed out waiting for condition');
};

const testChannel = async (): Promise<Channel> =>
  (await RabbitMQConnection.getInstance()).getConnection().createChannel();

const getFrom = async (queue: string) => {
  const channel = await testChannel();

  try {
    return await waitFor(() => channel.get(queue, { noAck: true }) as Promise<GetMessage | false>);
  } finally {
    await channel.close();
  }
};

describe('Queue (integração)', () => {
  afterAll(async () => {
    await (await RabbitMQConnection.getInstance()).getConnection().close();
  });

  it('should route by routing key and deliver everything to an exclusive # queue', async () => {
    const exchange = unique('events');
    const persisted: unknown[] = [];
    const delivered: unknown[] = [];

    await new TestConsumer(exchange, 'message.published', unique('persist'), async (data) => {
      persisted.push(data);
    }).startConsumer();
    const exclusive = new TestConsumer(
      exchange,
      '#',
      '',
      async (data) => {
        delivered.push(data);
      },
      { exclusive: true },
    );
    await exclusive.startConsumer();

    await Queue.publishExchange(exchange, 'message.published', { id: 1 });
    await Queue.publishExchange(exchange, 'chat.created', { id: 2 });

    await waitFor(async () => delivered.length === 2 && persisted.length === 1);

    expect(persisted).toEqual([{ id: 1 }]);
    expect(delivered).toEqual([{ id: 1 }, { id: 2 }]);
    expect(exclusive.queue).toMatch(/^amq\.gen-/);
  });

  it('should retry through the retry queue and move to the DLQ after 3 executions', async () => {
    const exchange = unique('events');
    const queue = unique('persist');
    let executions = 0;

    await new TestConsumer(
      exchange,
      'message.published',
      queue,
      async () => {
        executions++;
        throw new Error('transient failure');
      },
      { retryDelay: 100 },
    ).startConsumer();

    await Queue.publishExchange(exchange, 'message.published', { id: 1 });

    const dead = await getFrom(`${queue}.dlq`);

    expect(executions).toBe(3);
    expect(JSON.parse(dead.content.toString())).toEqual({ id: 1 });
    expect(dead.properties.headers).toMatchObject({
      'x-retry-count': 2,
      'x-final-failure': true,
      'x-failure-reason': 'max-attempts',
    });
  });

  it('should succeed on a retry without reaching the DLQ', async () => {
    const exchange = unique('events');
    const queue = unique('persist');
    let executions = 0;

    await new TestConsumer(
      exchange,
      'message.published',
      queue,
      async () => {
        executions++;

        if (executions === 1) {
          throw new Error('transient failure');
        }
      },
      { retryDelay: 100 },
    ).startConsumer();

    await Queue.publishExchange(exchange, 'message.published', { id: 1 });

    await waitFor(async () => executions === 2);

    const channel = await testChannel();
    const { messageCount } = await channel.checkQueue(`${queue}.dlq`);
    await channel.close();

    expect(messageCount).toBe(0);
  });

  it('should move an invalid payload straight to the DLQ without calling the handler', async () => {
    const exchange = unique('events');
    const queue = unique('persist');
    let executions = 0;

    await new TestConsumer(
      exchange,
      'message.published',
      queue,
      async () => {
        executions++;
      },
      { retryDelay: 100 },
    ).startConsumer();

    const channel = await testChannel();
    channel.publish(exchange, 'message.published', Buffer.from('{invalid'));
    await channel.close();

    const dead = await getFrom(`${queue}.dlq`);

    expect(executions).toBe(0);
    expect(dead.content.toString()).toBe('{invalid');
    expect(dead.properties.headers).toMatchObject({
      'x-retry-count': 0,
      'x-failure-reason': 'invalid-payload',
    });
  });
});
