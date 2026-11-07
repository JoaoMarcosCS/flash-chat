import { inject, injectable } from 'tsyringe';
import { IMessageRepository } from '../../repository/message-repository.interface';
import { ChatMessageResponse, toChatMessageResponse } from '../../mapper/message.mapper';
import { ListMessagesDTO } from './list-messages.schema';
import { IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { MessageError } from '@/shared/enums/erros.enum';
import { NotFoundException } from '@/shared/errors/errors';

export type ListMessagesResponse = {
  data: ChatMessageResponse[];
  nextCursor: string | null;
};

@injectable()
export class ListMessagesUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IMessageRepository') private messageRepository: IMessageRepository,
  ) {}

  async execute(
    { chatId, cursor, limit }: ListMessagesDTO,
    userId: string,
  ): Promise<ListMessagesResponse> {
    const chat = await this.chatRepository.findById(chatId, userId);

    if (!chat) {
      throw new NotFoundException(MessageError.CHAT_NOT_FOUND);
    }

    const messages = await this.messageRepository.findByChat({
      chatId: chat.id,
      cursor,
      limit: limit + 1,
    });

    const hasNextPage = messages.length > limit;
    const page = hasNextPage ? messages.slice(0, limit) : messages;

    return {
      data: page.map(toChatMessageResponse),
      nextCursor: hasNextPage ? page[page.length - 1].id : null,
    };
  }
}
