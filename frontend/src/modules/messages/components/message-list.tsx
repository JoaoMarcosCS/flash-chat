'use client';

import type { RefObject } from 'react';
import { CircleAlert, MessageCircle } from 'lucide-react';
import { useChatMessages } from '../hooks/use-chat-messages';
import type { ChatMessage } from '../interface/message.interface';
import { DaySeparator } from './day-separator';
import { MessageBubble } from './message-bubble';
import { EmptyState } from '@/components/common/empty-state';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { Spinner } from '@/components/ui/spinner';
import { formatDay, isSameDay } from '@/lib/format-date';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

interface MessageListProps {
  chatId: string;
  isGroup: boolean;
  currentUserId: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  onRetry: (message: ChatMessage) => void;
  onDiscard: (message: ChatMessage) => void;
}

export function MessageList({
  chatId,
  isGroup,
  currentUserId,
  scrollRef,
  onRetry,
  onDiscard,
}: MessageListProps) {
  const { messages, query } = useChatMessages(chatId, true);

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (query.isError) {
    return <EmptyState icon={CircleAlert} title={getApiErrorMessage(query.error)} />;
  }

  return (
    <div ref={scrollRef} className="flex flex-1 flex-col-reverse overflow-y-auto px-3 py-4 md:px-8">
      <RenderItems
        items={messages}
        getKey={(message) => message.clientId ?? message.id}
        empty={
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma mensagem ainda"
            description="Envie a primeira mensagem desta conversa."
          />
        }
      >
        {(message, index) => {
          const older = messages[index + 1];
          const date = new Date(message.createdAt);
          const startsDay = !older || !isSameDay(new Date(older.createdAt), date);
          const startsRun = startsDay || older.sender.id !== message.sender.id;

          return (
            <div className={startsRun ? 'pt-3' : 'pt-1'}>
              <RenderIf shouldRender={startsDay}>
                <DaySeparator label={formatDay(date)} />
              </RenderIf>
              <MessageBubble
                message={message}
                isOwn={message.sender.id === currentUserId}
                showSender={startsRun}
                isGroup={isGroup}
                onRetry={() => onRetry(message)}
                onDiscard={() => onDiscard(message)}
              />
            </div>
          );
        }}
      </RenderItems>
      <InfiniteScrollTrigger
        hasNextPage={query.hasNextPage}
        isFetching={query.isFetchingNextPage}
        onLoadMore={query.fetchNextPage}
      />
    </div>
  );
}
