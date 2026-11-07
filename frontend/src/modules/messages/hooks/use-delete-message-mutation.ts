import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { applyDeletedMessage } from '../cache/messages-cache';
import { deleteMessageRequest } from '../service/delete-message.request';
import { markChatReadOnly } from '@/modules/chats/cache/chats-cache';

export function useDeleteMessageMutation(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMessageRequest({ chatId, id }),
    onSuccess: (_, id) => {
      applyDeletedMessage(queryClient, { id, chatId, deletedAt: new Date().toISOString() });
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        markChatReadOnly(queryClient, chatId);
      }
    },
  });
}
