import { inject, injectable } from 'tsyringe';
import { v7 as uuidv7 } from 'uuid';
import { SendMessageDTO } from './send-message.schema';
import { MessagePublishedEvent } from '../../event/message-published.event';
import { ensureSenderCanWrite } from '../../guard/sender.guard';
import { IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { ServiceUnavailableException } from '@/shared/errors/errors';

export type SendMessageResponse = {
  id: string;
  createdAt: Date;
};

@injectable()
export class SendMessageUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute(
    { id: chatId, content }: SendMessageDTO,
    userId: string,
  ): Promise<SendMessageResponse> {
    this.logger.info('Executing SendMessageUseCase', { data: { userId, chatId } });

    const { chat, sender } = ensureSenderCanWrite(
      await this.chatRepository.findById(chatId, userId),
      userId,
    );

    const createdAt = new Date();
    const id = uuidv7({ msecs: createdAt.getTime() });

    const event: MessagePublishedEvent = {
      participantIds: chat.participants.map((participant) => participant.id),
      message: {
        id,
        chatId: chat.id,
        content,
        createdAt,
        sender: { id: sender.id, name: sender.name },
      },
    };

    try {
      await this.queue.publishExchange(Exchange.EVENTS, RoutingKey.MESSAGE_PUBLISHED, event);
    } catch (error) {
      this.logger.error('Failed to publish message.published', { chatId: chat.id, id, error });
      throw new ServiceUnavailableException(MessageError.MESSAGE_NOT_SENT);
    }

    return { id, createdAt };
  }
}
