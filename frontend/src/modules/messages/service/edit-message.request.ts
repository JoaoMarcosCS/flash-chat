import type { ContentStatus } from '../interface/message.interface';
import { api } from '@/lib/api';

interface EditMessageParams {
  chatId: string;
  id: string;
  content: string;
}

interface EditMessageResponse {
  id: string;
  chatId: string;
  content: string;
  contentStatus: ContentStatus;
  editedAt: string | null;
}

export async function editMessageRequest({
  chatId,
  id,
  content,
}: EditMessageParams): Promise<EditMessageResponse> {
  const { data } = await api.patch<EditMessageResponse>(`/chats/${chatId}/messages/${id}`, {
    content,
  });
  return data;
}
