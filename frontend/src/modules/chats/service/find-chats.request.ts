import type { ChatListItem, ChatType } from '../interface/chat.interface';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/paginated';

interface FindChatsParams {
  type: ChatType;
  search?: string;
  cursor?: string;
}

export async function findChatsRequest(params: FindChatsParams): Promise<Paginated<ChatListItem>> {
  const { data } = await api.get<Paginated<ChatListItem>>('/chats', { params });
  return data;
}
