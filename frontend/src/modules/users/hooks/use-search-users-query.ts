import { useInfiniteQuery } from '@tanstack/react-query';
import { searchUsersRequest } from '../service/search-users.request';

export function useSearchUsersQuery(search: string) {
  return useInfiniteQuery({
    queryKey: ['users', search],
    queryFn: ({ pageParam }) => searchUsersRequest({ search, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: search.length > 0,
  });
}
