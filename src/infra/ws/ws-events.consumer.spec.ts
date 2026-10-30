import { describe, expect, it, vi } from 'vitest';
import { toDelivery, WsEventsConsumer } from './ws-events.consumer';
import { ConnectionRegistry } from './connection-registry';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { Exchange, QueueName } from '@/shared/enums/queue/queue.enum';

const mockQueueProvider = (): IQueueProvider => ({
  publish: vi.fn(),
  publishExchange: vi.fn(),
  consume: vi.fn(),
  consumeExchange: vi.fn().mockResolvedValue(undefined),
  close: vi.fn(),
});

const mockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnThis(),
});

const makeConsumer = () => {
  const queue = mockQueueProvider();
  const registry = { send: vi.fn().mockReturnValue(1) } as unknown as ConnectionRegistry;
  const logger = mockLogger();

  return { queue, registry, logger, consumer: new WsEventsConsumer(queue, registry, logger) };
};

describe('WsEventsConsumer', () => {
  it('should consume every event through the ws events queue', async () => {
    const { queue, consumer } = makeConsumer();

    await consumer.start();

    expect(queue.consumeExchange).toHaveBeenCalledWith(
      Exchange.EVENTS,
      '#',
      QueueName.WS_EVENTS,
      consumer,
      { prefetch: 1, durable: true, noAck: false },
    );
  });

  it('should send the frame to the participants', async () => {
    const { registry, consumer } = makeConsumer();

    await consumer.consume({
      data: { participantIds: ['ana', 'bruno'], chat: { id: 'c1' } },
      routingKey: 'chat.created',
      attempt: 1,
    });

    expect(registry.send).toHaveBeenCalledWith(
      ['ana', 'bruno'],
      JSON.stringify({ type: 'chat.created', data: { chat: { id: 'c1' } } }),
    );
  });

  it('should discard an event without participantIds', async () => {
    const { registry, logger, consumer } = makeConsumer();

    await consumer.consume({ data: { chat: {} }, routingKey: 'chat.created', attempt: 1 });

    expect(registry.send).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('toDelivery', () => {
  it('should use participantIds as recipients and remove them from the frame', () => {
    expect(
      toDelivery('chat.created', { participantIds: ['ana', 'bruno'], chat: { id: 'c1' } }),
    ).toEqual({
      userIds: ['ana', 'bruno'],
      frame: { type: 'chat.created', data: { chat: { id: 'c1' } } },
    });
  });

  it.each([null, 'text', { chat: {} }, { participantIds: 'ana' }, { participantIds: [1] }])(
    'should return null for payload %j',
    (payload) => {
      expect(toDelivery('chat.created', payload)).toBeNull();
    },
  );
});
