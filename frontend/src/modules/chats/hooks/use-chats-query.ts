import { useInfiniteQuery } from '@tanstack/react-query';
import { chatsQueryKey } from '../cache/chats-cache';
import type { ChatType } from '../interface/chat.interface';
import { findChatsRequest } from '../service/find-chats.request';

export function useChatsQuery(type: ChatType, search: string) {
  return useInfiniteQuery({
    queryKey: chatsQueryKey(type, search),
    queryFn: ({ pageParam }) =>
      findChatsRequest({ type, search: search || undefined, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
