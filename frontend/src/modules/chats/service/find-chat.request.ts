import type { Chat } from '../interface/chat.interface';
import { api } from '@/lib/api';

export async function findChatRequest(chatId: string): Promise<Chat> {
  const { data } = await api.get<Chat>(`/chats/${chatId}`);
  return data;
}
