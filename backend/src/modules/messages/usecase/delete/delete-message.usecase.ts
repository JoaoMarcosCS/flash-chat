import { inject, injectable } from 'tsyringe';
import { DeleteMessageDTO } from './delete-message.schema';
import { IMessageRepository } from '../../repository/message-repository.interface';
import { MessageDeletedEvent } from '../../event/message-deleted.event';
import { ensureSenderCanChange, ensureSenderCanWrite } from '../../guard/sender.guard';
import { IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { ConflictException } from '@/shared/errors/errors';

@injectable()
export class DeleteMessageUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IMessageRepository') private messageRepository: IMessageRepository,
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute({ chatId, id }: DeleteMessageDTO, userId: string): Promise<void> {
    this.logger.info('Executing DeleteMessageUseCase', { data: { userId, chatId, id } });

    const { chat } = ensureSenderCanWrite(
      await this.chatRepository.findById(chatId, userId),
      userId,
    );

    ensureSenderCanChange(await this.messageRepository.findById(id, chat.id), userId);

    const deletedAt = new Date();

    const deleted = await this.messageRepository.delete({ id, chatId: chat.id, deletedAt });

    if (!deleted) {
      throw new ConflictException(MessageError.MESSAGE_ALREADY_DELETED);
    }

    const event: MessageDeletedEvent = {
      participantIds: chat.participants.map((participant) => participant.id),
      message: { id, chatId: chat.id, deletedAt },
    };

    try {
      await this.queue.publishExchange(Exchange.EVENTS, RoutingKey.MESSAGE_DELETED, event);
    } catch (error) {
      this.logger.error('Failed to publish message.deleted', { chatId: chat.id, id, error });
    }
  }
}
