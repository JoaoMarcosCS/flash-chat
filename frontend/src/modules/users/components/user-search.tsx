'use client';

import { useState, type ReactNode } from 'react';
import { CircleAlert, Search, SearchX, UserRoundSearch } from 'lucide-react';
import { useSearchUsersQuery } from '../hooks/use-search-users-query';
import type { PublicUser } from '../interface/user.interface';
import { EmptyState } from '@/components/common/empty-state';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderItems } from '@/components/common/render-items';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { flattenPages } from '@/lib/paginated';
import { SEARCH_MAX_LENGTH, toSearchTerm } from '@/lib/search-term';
import { cn } from '@/lib/utils';

interface UserSearchProps {
  onSelect: (user: PublicUser) => void;
  isSelected?: (user: PublicUser) => boolean;
  isDisabled?: (user: PublicUser) => boolean;
  trailing?: (user: PublicUser) => ReactNode;
}

export function UserSearch({ onSelect, isSelected, isDisabled, trailing }: UserSearchProps) {
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(toSearchTerm(search));
  const { data, isFetching, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSearchUsersQuery(term);

  const renderResults = () => {
    if (!term) {
      return (
        <EmptyState
          icon={UserRoundSearch}
          title="Busque pelo nome ou Nickname"
          description="Digite ao menos 2 letras ou números."
        />
      );
    }
    if (isError) return <EmptyState icon={CircleAlert} title={getApiErrorMessage(error)} />;
    if (!data && isFetching) {
      return (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      );
    }

    return (
      <>
        <ul className="flex flex-col gap-0.5">
          <RenderItems
            items={flattenPages(data)}
            getKey={(user) => user.id}
            empty={<EmptyState icon={SearchX} title="Nenhum usuário encontrado" />}
          >
            {(user) => (
              <li>
                <button
                  type="button"
                  onClick={() => onSelect(user)}
                  disabled={isDisabled?.(user)}
                  aria-pressed={isSelected?.(user)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    isSelected?.(user) ? 'bg-muted' : 'hover:bg-muted/60',
                  )}
                >
                  <Avatar id={user.id} name={user.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{user.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      @{user.nickname}
                    </span>
                  </span>
                  {trailing?.(user)}
                </button>
              </li>
            )}
          </RenderItems>
        </ul>
        <InfiniteScrollTrigger
          hasNextPage={hasNextPage}
          isFetching={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-4 pb-3 md:px-6">
        <label className="relative block">
          <span className="sr-only">Buscar usuários</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            autoFocus
            value={search}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
            placeholder="Buscar por nome ou Nickname..."
            className="pl-10"
          />
        </label>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-2 pb-4 md:px-4">
        {renderResults()}
      </div>
    </div>
  );
}
