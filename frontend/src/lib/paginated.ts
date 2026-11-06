import type { InfiniteData } from '@tanstack/react-query';

export interface Paginated<T> {
  data: T[];
  nextCursor: string | null;
}

export type InfinitePages<T> = InfiniteData<Paginated<T>, unknown>;

export function flattenPages<T>(data: InfinitePages<T> | undefined): T[] {
  return data?.pages.flatMap((page) => page.data) ?? [];
}
