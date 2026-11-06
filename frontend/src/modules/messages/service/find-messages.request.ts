import type { Message } from '../interface/message.interface';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/paginated';

interface FindMessagesParams {
  chatId: string;
  cursor?: string;
}

export async function findMessagesRequest({
  chatId,
  cursor,
}: FindMessagesParams): Promise<Paginated<Message>> {
  const { data } = await api.get<Paginated<Message>>(`/chats/${chatId}/messages`, {
    params: { cursor },
  });
  return data;
}
