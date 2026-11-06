'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CircleAlert, MessagesSquare, SearchX, Users } from 'lucide-react';
import { useChatsQuery } from '../hooks/use-chats-query';
import type { ChatType } from '../interface/chat.interface';
import { ChatListItem } from './chat-list-item';
import { EmptyState } from '@/components/common/empty-state';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { buttonClassName } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { flattenPages } from '@/lib/paginated';
import { useSessionStore } from '@/stores/session.store';

const EMPTY_STATES = {
  direct: {
    icon: MessagesSquare,
    title: 'Nenhuma conversa ainda',
    description: 'Encontre alguém pelo nome ou Nickname e comece a conversar.',
    actionLabel: 'Nova conversa',
    actionHref: '/chats/new',
    notFound: 'Nenhuma conversa encontrada',
  },
  group: {
    icon: Users,
    title: 'Nenhum grupo ainda',
    description: 'Crie um grupo com 3 a 50 participantes.',
    actionLabel: 'Novo grupo',
    actionHref: '/groups/new',
    notFound: 'Nenhum grupo encontrado',
  },
};

interface ChatListProps {
  type: ChatType;
  search: string;
}

export function ChatList({ type, search }: ChatListProps) {
  const params = useParams<{ id?: string }>();
  const userId = useSessionStore((state) => state.user?.id ?? '');
  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChatsQuery(type, search);
  const emptyState = EMPTY_STATES[type];

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={CircleAlert} title={getApiErrorMessage(error)} />;
  }

  return (
    <>
      <ul className="flex flex-col gap-0.5">
        <RenderItems
          items={flattenPages(data)}
          getKey={(chat) => chat.id}
          empty={
            <RenderIf
              shouldRender={search}
              fallback={
                <EmptyState
                  icon={emptyState.icon}
                  title={emptyState.title}
                  description={emptyState.description}
                  action={
                    <Link
                      href={emptyState.actionHref}
                      className={buttonClassName({ variant: 'soft', size: 'sm' })}
                    >
                      {emptyState.actionLabel}
                    </Link>
                  }
                />
              }
            >
              <EmptyState icon={SearchX} title={emptyState.notFound} />
            </RenderIf>
          }
        >
          {(chat) => (
            <li>
              <ChatListItem chat={chat} currentUserId={userId} active={chat.id === params.id} />
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
}
