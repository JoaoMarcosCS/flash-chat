import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../repository/IChatRepository';
import { ChatResponse, toChatResponse } from '../../mapper/chat.mapper';
import { GetChatDTO } from './get-chat.schema';
import { MessageError } from '@/shared/enums/erros.enum';
import { NotFoundException } from '@/shared/errors/errors';

@injectable()
export class GetChatUseCase {
  constructor(@inject('IChatRepository') private chatRepository: IChatRepository) {}

  async execute({ id }: GetChatDTO, userId: string): Promise<ChatResponse> {
    const chat = await this.chatRepository.findById(id, userId);

    if (!chat) {
      throw new NotFoundException(MessageError.CHAT_NOT_FOUND);
    }

    return toChatResponse(chat);
  }
}
