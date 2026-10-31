import { inject, injectable } from 'tsyringe';
import { IMessageRepository } from '../repository/message-repository.interface';
import { MessagePublishedSchema } from '../event/message-published.event';
import { MessagePersistedEvent } from '../event/message-persisted.event';
import {
  IQueueConsumer,
  IQueueProvider,
  QueueMessage,
} from '@/infra/queue/queue-provider.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { Exchange, QueueName, RoutingKey } from '@/shared/enums/queue/queue.enum';

export const PERSIST_MESSAGE_RETRY_DELAY_MS = 120_000;

export const PERSIST_MESSAGE_MAX_ATTEMPTS = 3;

@injectable()
export class PersistMessageConsumer implements IQueueConsumer {
  private logger: ILogger;

  constructor(
    @inject('IMessageRepository') private messageRepository: IMessageRepository,
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject('ILogger') logger: ILogger,
  ) {
    this.logger = logger.child('PersistMessageConsumer');
  }

  async start(): Promise<void> {
    await this.queue.consumeExchange(
      Exchange.EVENTS,
      RoutingKey.MESSAGE_PUBLISHED,
      QueueName.MESSAGES_PERSIST,
      this,
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
  }

  async consume({ data, attempt }: QueueMessage<unknown>): Promise<void> {
    const { message } = MessagePublishedSchema.parse(data);

    await this.messageRepository.persist({
      id: message.id,
      chatId: message.chatId,
      senderId: message.sender.id,
      content: message.content,
      createdAt: message.createdAt,
    });

    const event: MessagePersistedEvent = {
      participantIds: [message.sender.id],
      message: { id: message.id, chatId: message.chatId },
    };

    await this.queue.publishExchange(Exchange.EVENTS, RoutingKey.MESSAGE_PERSISTED, event);

    this.logger.info('Message persisted', { id: message.id, chatId: message.chatId, attempt });
  }
}
