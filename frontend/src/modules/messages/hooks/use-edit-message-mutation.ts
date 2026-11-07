import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { applyEditedMessage } from '../cache/messages-cache';
import { editMessageRequest } from '../service/edit-message.request';
import { markChatReadOnly } from '@/modules/chats/cache/chats-cache';

export function useEditMessageMutation(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      editMessageRequest({ chatId, id, content }),
    onSuccess: ({ id, content, editedAt }) => {
      if (editedAt) applyEditedMessage(queryClient, { id, chatId, content, editedAt });
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        markChatReadOnly(queryClient, chatId);
      }
    },
  });
}
