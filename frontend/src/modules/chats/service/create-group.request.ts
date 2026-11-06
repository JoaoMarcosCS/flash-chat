import type { Chat } from '../interface/chat.interface';
import type { CreateGroupDTO } from '../schema/create-group.schema';
import { api } from '@/lib/api';

export async function createGroupRequest(body: CreateGroupDTO): Promise<Chat> {
  const { data } = await api.post<Chat>('/chats/groups', body);
  return data;
}
