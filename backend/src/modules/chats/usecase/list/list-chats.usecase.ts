import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../repository/chat-repository.interface';
import { ChatListItemResponse, toChatListItemResponse } from '../../mapper/chat.mapper';
import { ListChatsDTO } from './list-chats.schema';
import { buildTsQuery } from '@/shared/utils/build-ts-query';
import { ChatType } from '@/shared/enums/chats/chat-type.enum';

export type ListChatsResponse = {
  data: ChatListItemResponse[];
  nextCursor: string | null;
};

@injectable()
export class ListChatsUseCase {
  constructor(@inject('IChatRepository') private chatRepository: IChatRepository) {}

  async execute(
    { search, type, cursor, limit }: ListChatsDTO,
    userId: string,
  ): Promise<ListChatsResponse> {
    const chats = await this.chatRepository.findByParticipant({
      userId,
      value: buildTsQuery(search),
      isGroup: type ? type === ChatType.GROUP : undefined,
      cursor,
      limit: limit + 1,
    });

    const hasNextPage = chats.length > limit;
    const page = hasNextPage ? chats.slice(0, limit) : chats;
    const last = page[page.length - 1];

    return {
      data: page.map(toChatListItemResponse),
      nextCursor: hasNextPage ? (last.lastMessage?.id ?? last.id) : null,
    };
  }
}
