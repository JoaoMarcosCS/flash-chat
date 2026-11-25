'use client';

import { useState, type ReactNode } from 'react';
import { CircleAlert, Search, SearchX, UserRoundSearch } from 'lucide-react';
import { useSearchUsersQuery } from '../hooks/use-search-users-query';
import type { PublicUser } from '../interface/user.interface';
import { EmptyState } from '@/components/common/empty-state';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderItems } from '@/components/common/render-items';
import { UserAvatar } from '@/components/common/user-avatar';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
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

const SKELETON_ROWS = [1, 2, 3, 4, 5];

function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
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
        <div aria-busy aria-label="Buscando usuários" className="flex flex-col gap-0.5">
          <RenderItems items={SKELETON_ROWS} getKey={(row) => row}>
            {() => <UserRowSkeleton />}
          </RenderItems>
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
                  <UserAvatar id={user.id} name={user.name} size="lg" />
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
          skeleton={<UserRowSkeleton />}
        />
      </>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-4 pb-3 md:px-6">
        <label className="block">
          <span className="sr-only">Buscar usuários</span>
          <InputGroup className="bg-card">
            <InputGroupInput
              type="search"
              autoFocus
              value={search}
              maxLength={SEARCH_MAX_LENGTH}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
              placeholder="Buscar por nome ou Nickname..."
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </label>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-2 pb-4 md:px-4">
        {renderResults()}
      </div>
    </div>
  );
}
