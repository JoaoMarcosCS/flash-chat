import { api } from '@/lib/api';

interface DeleteMessageParams {
  chatId: string;
  id: string;
}

export async function deleteMessageRequest({ chatId, id }: DeleteMessageParams): Promise<void> {
  await api.delete(`/chats/${chatId}/messages/${id}`);
}
