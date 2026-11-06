import { useQuery } from '@tanstack/react-query';
import { chatQueryKey } from '../cache/chats-cache';
import { findChatRequest } from '../service/find-chat.request';

export function useChatQuery(chatId: string) {
  return useQuery({
    queryKey: chatQueryKey(chatId),
    queryFn: () => findChatRequest(chatId),
    retry: false,
  });
}
