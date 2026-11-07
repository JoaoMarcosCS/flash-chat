'use client';

import { useState, type RefObject } from 'react';
import { CircleAlert, MessageCircle } from 'lucide-react';
import { canChange } from '../display/message-display';
import { useChatMessages } from '../hooks/use-chat-messages';
import { useDeleteMessageMutation } from '../hooks/use-delete-message-mutation';
import { useEditMessageMutation } from '../hooks/use-edit-message-mutation';
import type { ChatMessage } from '../interface/message.interface';
import { DaySeparator } from './day-separator';
import { MessageBubble } from './message-bubble';
import { EmptyState } from '@/components/common/empty-state';
import { FormError } from '@/components/common/form-error';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatDay, isSameDay } from '@/lib/format-date';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

interface MessageListProps {
  chatId: string;
  isGroup: boolean;
  readOnly: boolean;
  currentUserId: string;
  scrollRef: RefObject<HTMLDivElement | null>;
  onRetry: (message: ChatMessage) => void;
  onDiscard: (message: ChatMessage) => void;
}

export function MessageList({
  chatId,
  isGroup,
  readOnly,
  currentUserId,
  scrollRef,
  onRetry,
  onDiscard,
}: MessageListProps) {
  const { messages, query } = useChatMessages(chatId, true);
  const editMessage = useEditMessageMutation(chatId);
  const deleteMessage = useDeleteMessageMutation(chatId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const changeError = editMessage.error ?? deleteMessage.error;

  const startEdit = (id: string) => {
    deleteMessage.reset();
    editMessage.reset();
    setEditingId(id);
  };

  const saveEdit = (id: string, content: string) =>
    editMessage.mutate({ id, content }, { onSuccess: () => setEditingId(null) });

  const confirmDelete = () => {
    if (!deletingId) return;
    editMessage.reset();
    deleteMessage.mutate(deletingId);
    setDeletingId(null);
  };

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
      <div className="sticky bottom-0 z-10 rounded-lg bg-surface empty:hidden">
        <FormError message={changeError ? getApiErrorMessage(changeError) : null} />
      </div>
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
          const isOwn = message.sender.id === currentUserId;

          return (
            <div className={startsRun ? 'pt-3' : 'pt-1'}>
              <RenderIf shouldRender={startsDay}>
                <DaySeparator label={formatDay(date)} />
              </RenderIf>
              <MessageBubble
                message={message}
                isOwn={isOwn}
                showSender={startsRun}
                isGroup={isGroup}
                canChange={canChange(message, isOwn, readOnly)}
                isEditing={editingId === message.id}
                isSaving={editMessage.isPending}
                onRetry={() => onRetry(message)}
                onDiscard={() => onDiscard(message)}
                onStartEdit={() => startEdit(message.id)}
                onSaveEdit={(content) => saveEdit(message.id, content)}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => setDeletingId(message.id)}
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
      <ConfirmDialog
        open={deletingId !== null}
        title="Apagar mensagem?"
        description="A mensagem será apagada para todos os participantes da conversa."
        confirmLabel="Apagar"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
