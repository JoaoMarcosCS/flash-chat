import { api } from '@/lib/api';

interface SendMessageParams {
  chatId: string;
  content: string;
}

interface SendMessageResponse {
  id: string;
  createdAt: string;
}

export async function sendMessageRequest({
  chatId,
  content,
}: SendMessageParams): Promise<SendMessageResponse> {
  const { data } = await api.post<SendMessageResponse>(`/chats/${chatId}/messages`, { content });
  return data;
}
