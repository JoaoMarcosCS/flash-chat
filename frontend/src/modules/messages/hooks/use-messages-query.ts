import { useInfiniteQuery } from '@tanstack/react-query';
import { findMessagesRequest } from '../service/find-messages.request';

export const messagesQueryKey = (chatId: string) => ['messages', chatId] as const;

export function useMessagesQuery(chatId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: messagesQueryKey(chatId),
    queryFn: ({ pageParam }) => findMessagesRequest({ chatId, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
