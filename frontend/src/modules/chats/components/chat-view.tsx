'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircleAlert } from 'lucide-react';
import { useChatQuery } from '../hooks/use-chat-query';
import { ChatHeader } from './chat-header';
import { ParticipantsPanel } from './participants-panel';
import { EmptyState } from '@/components/common/empty-state';
import { RenderIf } from '@/components/common/render-if';
import { Spinner } from '@/components/ui/spinner';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { MessageComposer } from '@/modules/messages/components/message-composer';
import { MessageList } from '@/modules/messages/components/message-list';
import { useSendMessage } from '@/modules/messages/hooks/use-send-message';
import { useSessionStore } from '@/stores/session.store';

export function ChatView() {
  const { id: chatId } = useParams<{ id: string }>();
  const userId = useSessionStore((state) => state.user?.id ?? '');
  const { data: chat, isPending, isError, error } = useChatQuery(chatId);
  const { send, retry, discard } = useSendMessage(chatId);
  const [showParticipants, setShowParticipants] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={CircleAlert} title={getApiErrorMessage(error)} />;
  }

  const handleSend = (content: string) => {
    send(content);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ChatHeader
        chat={chat}
        currentUserId={userId}
        participantsOpen={showParticipants}
        onToggleParticipants={() => setShowParticipants((value) => !value)}
      />
      <MessageList
        key={chatId}
        chatId={chatId}
        isGroup={chat.isGroup}
        currentUserId={userId}
        scrollRef={scrollRef}
        onRetry={(message) => message.clientId && retry(message.clientId, message.content ?? '')}
        onDiscard={(message) => message.clientId && discard(message.clientId)}
      />
      <MessageComposer readOnly={chat.readOnly} onSend={handleSend} />
      <RenderIf shouldRender={showParticipants}>
        <ParticipantsPanel
          chat={chat}
          currentUserId={userId}
          onClose={() => setShowParticipants(false)}
        />
      </RenderIf>
    </div>
  );
}
