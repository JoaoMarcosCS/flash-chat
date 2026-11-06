import type { Chat } from '../interface/chat.interface';
import { api } from '@/lib/api';

interface CreateDirectChatResponse {
  chat: Chat;
  created: boolean;
}

export async function createDirectChatRequest(
  participantId: string,
): Promise<CreateDirectChatResponse> {
  const { data, status } = await api.post<Chat>('/chats/direct', { participantId });
  return { chat: data, created: status === 201 };
}
