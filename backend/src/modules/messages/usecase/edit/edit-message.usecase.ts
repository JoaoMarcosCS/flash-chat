import { inject, injectable } from 'tsyringe';
import { EditMessageDTO } from './edit-message.schema';
import { IMessageRepository } from '../../repository/message-repository.interface';
import { MessageEditedEvent } from '../../event/message-edited.event';
import { ensureSenderCanChange, ensureSenderCanWrite } from '../../guard/sender.guard';
import { IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { ContentStatus } from '@/shared/enums/messages/content-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { ConflictException } from '@/shared/errors/errors';

export type EditMessageResponse = {
  id: string;
  chatId: string;
  content: string;
  contentStatus: ContentStatus;
  editedAt: Date | null;
};

@injectable()
export class EditMessageUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IMessageRepository') private messageRepository: IMessageRepository,
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute(
    { chatId, id, content }: EditMessageDTO,
    userId: string,
  ): Promise<EditMessageResponse> {
    this.logger.info('Executing EditMessageUseCase', { data: { userId, chatId, id } });

    const { chat } = ensureSenderCanWrite(
      await this.chatRepository.findById(chatId, userId),
      userId,
    );

    const message = ensureSenderCanChange(
      await this.messageRepository.findById(id, chat.id),
      userId,
    );

    if (message.content === content) {
      return {
        id,
        chatId: chat.id,
        content,
        contentStatus: message.contentStatus,
        editedAt: message.editedAt,
      };
    }

    const editedAt = new Date();

    const edited = await this.messageRepository.edit({ id, chatId: chat.id, content, editedAt });

    if (!edited) {
      throw new ConflictException(MessageError.MESSAGE_ALREADY_DELETED);
    }

    const event: MessageEditedEvent = {
      participantIds: chat.participants.map((participant) => participant.id),
      message: { id, chatId: chat.id, content, editedAt },
    };

    try {
      await this.queue.publishExchange(Exchange.EVENTS, RoutingKey.MESSAGE_EDITED, event);
    } catch (error) {
      this.logger.error('Failed to publish message.edited', { chatId: chat.id, id, error });
    }

    return { id, chatId: chat.id, content, contentStatus: ContentStatus.EDITED, editedAt };
  }
}
