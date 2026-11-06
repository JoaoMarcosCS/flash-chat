import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { addCreatedChat, chatQueryKey } from '../cache/chats-cache';
import { getChatHref } from '../display/chat-display';
import { createDirectChatRequest } from '../service/create-direct-chat.request';
import { useSessionStore } from '@/stores/session.store';

export function useCreateDirectChatMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDirectChatRequest,
    onSuccess: ({ chat, created }) => {
      const userId = useSessionStore.getState().user?.id ?? '';
      if (created) addCreatedChat(queryClient, chat, userId);
      else queryClient.setQueryData(chatQueryKey(chat.id), chat);
      router.push(getChatHref(chat));
    },
  });
}
