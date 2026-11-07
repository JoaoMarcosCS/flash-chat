import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PERSIST_MESSAGE_MAX_ATTEMPTS,
  PERSIST_MESSAGE_RETRY_DELAY_MS,
  PersistMessageConsumer,
} from './persist-message.consumer';
import { IMessageRepository } from '../repository/message-repository.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { Exchange, QueueName, RoutingKey } from '@/shared/enums/queue/queue.enum';

const senderId = '0199b7a0-0000-7000-8000-000000000001';
const otherId = '0199b7a0-0000-7000-8000-000000000002';
const chatId = '0199b7a0-0000-7000-8000-0000000000aa';
const messageId = '0199b7a0-0000-7000-8000-0000000000bb';

const payload = {
  participantIds: [senderId, otherId],
  message: {
    id: messageId,
    chatId,
    content: 'Oi',
    createdAt: '2026-10-30T12:00:00.000Z',
    sender: { id: senderId, name: 'Ana Souza' },
  },
};

const mockMessageRepository = (): IMessageRepository => ({
  persist: vi.fn().mockResolvedValue(undefined),
  findByChat: vi.fn(),
  findById: vi.fn(),
  edit: vi.fn(),
  delete: vi.fn(),
});

const mockQueueProvider = (): IQueueProvider => ({
  publish: vi.fn(),
  publishExchange: vi.fn().mockResolvedValue(undefined),
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

const consumeMessage = (data: unknown) => ({
  data,
  routingKey: RoutingKey.MESSAGE_PUBLISHED,
  attempt: 1,
});

describe('PersistMessageConsumer', () => {
  let messageRepository: IMessageRepository;
  let queue: IQueueProvider;
  let consumer: PersistMessageConsumer;

  beforeEach(() => {
    messageRepository = mockMessageRepository();
    queue = mockQueueProvider();
    consumer = new PersistMessageConsumer(messageRepository, queue, mockLogger());
  });

  it('should consume message.published from messages.persist with retry', async () => {
    await consumer.start();

    expect(queue.consumeExchange).toHaveBeenCalledWith(
      Exchange.EVENTS,
      RoutingKey.MESSAGE_PUBLISHED,
      QueueName.MESSAGES_PERSIST,
      consumer,
      {
        prefetch: 1,
        durable: true,
        noAck: false,
        retry: {
          delayMs: PERSIST_MESSAGE_RETRY_DELAY_MS,
          maxAttempts: PERSIST_MESSAGE_MAX_ATTEMPTS,
        },
      },
    );
  });

  it('should persist the message and publish message.persisted to the sender', async () => {
    await consumer.consume(consumeMessage(payload));

    expect(messageRepository.persist).toHaveBeenCalledWith({
      id: messageId,
      chatId,
      senderId,
      content: 'Oi',
      createdAt: new Date('2026-10-30T12:00:00.000Z'),
    });
    expect(queue.publishExchange).toHaveBeenCalledWith(
      Exchange.EVENTS,
      RoutingKey.MESSAGE_PERSISTED,
      { participantIds: [senderId], message: { id: messageId, chatId } },
    );
  });

  it.each([
    ['without message', { participantIds: [senderId] }],
    ['with empty content', { ...payload, message: { ...payload.message, content: '' } }],
    ['with invalid sender', { ...payload, message: { ...payload.message, sender: {} } }],
  ])('should throw for a payload %s', async (_, data) => {
    await expect(consumer.consume(consumeMessage(data))).rejects.toThrow();

    expect(messageRepository.persist).not.toHaveBeenCalled();
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });

  it('should not publish message.persisted when persisting fails', async () => {
    vi.mocked(messageRepository.persist).mockRejectedValueOnce(new Error('database down'));

    await expect(consumer.consume(consumeMessage(payload))).rejects.toThrow('database down');

    expect(queue.publishExchange).not.toHaveBeenCalled();
  });
});
