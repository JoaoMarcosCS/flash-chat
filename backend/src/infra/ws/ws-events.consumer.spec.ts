import { describe, expect, it, vi } from 'vitest';
import { toDelivery, USER_DEACTIVATED_CLOSE_CODE, WsEventsConsumer } from './ws-events.consumer';
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
  const registry = {
    send: vi.fn().mockReturnValue(1),
    close: vi.fn(),
  } as unknown as ConnectionRegistry;
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

  it('should send the event to the participants', async () => {
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

  it('should notify the participants and close the sockets of a deactivated user', async () => {
    const { registry, consumer } = makeConsumer();

    await consumer.consume({
      data: { participantIds: ['bruno'], user: { id: 'ana' } },
      routingKey: 'user.deactivated',
      attempt: 1,
    });

    expect(registry.send).toHaveBeenCalledWith(
      ['bruno'],
      JSON.stringify({ type: 'user.deactivated', data: { user: { id: 'ana' } } }),
    );
    expect(registry.close).toHaveBeenCalledWith(
      'ana',
      USER_DEACTIVATED_CLOSE_CODE,
      'Usuário desativado',
    );
  });

  it('should not close sockets for other events', async () => {
    const { registry, consumer } = makeConsumer();

    await consumer.consume({
      data: { participantIds: ['ana'], chat: { id: 'c1' } },
      routingKey: 'chat.created',
      attempt: 1,
    });

    expect(registry.close).not.toHaveBeenCalled();
  });

  it('should discard an event without participantIds', async () => {
    const { registry, logger, consumer } = makeConsumer();

    await consumer.consume({ data: { chat: {} }, routingKey: 'chat.created', attempt: 1 });

    expect(registry.send).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('toDelivery', () => {
  it('should use participantIds as recipients and remove them from the event', () => {
    expect(
      toDelivery('chat.created', { participantIds: ['ana', 'bruno'], chat: { id: 'c1' } }),
    ).toEqual({
      userIds: ['ana', 'bruno'],
      event: { type: 'chat.created', data: { chat: { id: 'c1' } } },
    });
  });

  it.each([null, 'text', { chat: {} }, { participantIds: 'ana' }, { participantIds: [1] }])(
    'should return null for payload %j',
    (payload) => {
      expect(toDelivery('chat.created', payload)).toBeNull();
    },
  );
});
