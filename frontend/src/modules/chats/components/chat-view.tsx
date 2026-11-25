'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { useChatQuery } from '../hooks/use-chat-query';
import { ChatHeader } from './chat-header';
import { ParticipantsPanel } from './participants-panel';
import { EmptyState } from '@/components/common/empty-state';
import { RenderIf } from '@/components/common/render-if';
import { MessageScrollerProvider } from '@/components/ui/message-scroller';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { MessageComposer } from '@/modules/messages/components/message-composer';
import { MessageList } from '@/modules/messages/components/message-list';
import { MessageListSkeleton } from '@/modules/messages/components/message-list-skeleton';
import { useSendMessage } from '@/modules/messages/hooks/use-send-message';
import { useSessionStore } from '@/stores/session.store';

function ChatViewSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b bg-surface px-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <MessageListSkeleton />
      <div className="shrink-0 px-4 pt-2 pb-4 md:px-8">
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ChatView() {
  const { id: chatId } = useParams<{ id: string }>();
  const userId = useSessionStore((state) => state.user?.id ?? '');
  const { data: chat, isPending, isError, error } = useChatQuery(chatId);
  const { send, retry, discard } = useSendMessage(chatId);
  const [showParticipants, setShowParticipants] = useState(false);

  if (isPending) return <ChatViewSkeleton />;

  if (isError) {
    return <EmptyState icon={CircleAlert} title={getApiErrorMessage(error)} />;
  }

  return (
    <MessageScrollerProvider key={chatId} autoScroll>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ChatHeader
          chat={chat}
          currentUserId={userId}
          participantsOpen={showParticipants}
          onToggleParticipants={() => setShowParticipants((value) => !value)}
        />
        <MessageList
          chatId={chatId}
          isGroup={chat.isGroup}
          readOnly={chat.readOnly}
          currentUserId={userId}
          onRetry={(message) => message.clientId && retry(message.clientId, message.content ?? '')}
          onDiscard={(message) => message.clientId && discard(message.clientId)}
        />
        <MessageComposer readOnly={chat.readOnly} onSend={send} />
        <RenderIf shouldRender={showParticipants}>
          <ParticipantsPanel
            chat={chat}
            currentUserId={userId}
            onClose={() => setShowParticipants(false)}
          />
        </RenderIf>
      </div>
    </MessageScrollerProvider>
  );
}
