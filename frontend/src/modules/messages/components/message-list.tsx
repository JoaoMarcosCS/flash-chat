'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, CircleAlert, MessageCircle } from 'lucide-react';
import { canChange } from '../display/message-display';
import { getMessageKey, toMessageRuns } from '../display/message-runs';
import { useChatMessages } from '../hooks/use-chat-messages';
import { useDeleteMessageMutation } from '../hooks/use-delete-message-mutation';
import { useEditMessageMutation } from '../hooks/use-edit-message-mutation';
import type { ChatMessage } from '../interface/message.interface';
import { DaySeparator } from './day-separator';
import { MessageItem } from './message-item';
import { MessageListSkeleton } from './message-list-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { FormError } from '@/components/common/form-error';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MessageGroup } from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDay } from '@/lib/format-date';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

interface MessageListProps {
  chatId: string;
  isGroup: boolean;
  readOnly: boolean;
  currentUserId: string;
  onRetry: (message: ChatMessage) => void;
  onDiscard: (message: ChatMessage) => void;
}

export function MessageList({
  chatId,
  isGroup,
  readOnly,
  currentUserId,
  onRetry,
  onDiscard,
}: MessageListProps) {
  const { messages, query } = useChatMessages(chatId, true);
  const runs = useMemo(() => toMessageRuns(messages), [messages]);
  const editMessage = useEditMessageMutation(chatId);
  const deleteMessage = useDeleteMessageMutation(chatId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const changeError = editMessage.error ?? deleteMessage.error;
  const viewportRef = useRef<HTMLDivElement>(null);
  const distanceFromBottomRef = useRef<number | null>(null);
  const pageCount = query.data?.pages.length ?? 0;
  const [canLoadOlder, setCanLoadOlder] = useState(false);

  useEffect(() => {
    if (canLoadOlder || pageCount === 0) return;
    const frame = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      if (viewport && viewport.scrollHeight <= viewport.clientHeight) setCanLoadOlder(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [canLoadOlder, pageCount]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const distance = distanceFromBottomRef.current;
    if (!viewport || distance === null) return;
    viewport.scrollTop = viewport.scrollHeight - distance;
    distanceFromBottomRef.current = null;
  }, [pageCount]);

  const loadOlder = () => {
    const viewport = viewportRef.current;
    if (viewport) distanceFromBottomRef.current = viewport.scrollHeight - viewport.scrollTop;
    void query.fetchNextPage();
  };

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

  if (query.isPending) return <MessageListSkeleton />;

  if (query.isError) {
    return <EmptyState icon={CircleAlert} title={getApiErrorMessage(query.error)} />;
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <RenderIf
        shouldRender={runs.length}
        fallback={
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma mensagem ainda"
            description="Envie a primeira mensagem desta conversa."
          />
        }
      >
        <MessageScroller className="flex-1">
          <MessageScrollerViewport
            ref={viewportRef}
            aria-label="Mensagens"
            preserveScrollOnPrepend={false}
            onScroll={() => setCanLoadOlder(true)}
          >
            <MessageScrollerContent className="gap-4 px-4 py-6 md:px-8">
              <InfiniteScrollTrigger
                hasNextPage={query.hasNextPage && canLoadOlder}
                isFetching={query.isFetchingNextPage}
                onLoadMore={loadOlder}
                skeleton={<Skeleton className="h-9 w-48 rounded-xl" />}
              />
              <RenderItems items={runs} getKey={(run) => run.id}>
                {(run) => {
                  const isOwn = run.senderId === currentUserId;
                  const withAvatar = isGroup && !isOwn;

                  return (
                    <>
                      <RenderIf shouldRender={run.startsDay}>
                        <MessageScrollerItem messageId={`day-${run.date.toDateString()}`}>
                          <DaySeparator label={formatDay(run.date)} />
                        </MessageScrollerItem>
                      </RenderIf>
                      <MessageScrollerItem messageId={run.id}>
                        <MessageGroup className="gap-1">
                          <RenderItems items={run.messages} getKey={getMessageKey}>
                            {(message, index) => (
                              <MessageItem
                                message={message}
                                isOwn={isOwn}
                                withAvatar={withAvatar}
                                showAvatar={index === run.messages.length - 1}
                                showHeader={!isOwn && index === 0}
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
                            )}
                          </RenderItems>
                        </MessageGroup>
                      </MessageScrollerItem>
                    </>
                  );
                }}
              </RenderItems>
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton>
            <ArrowDown />
            <span className="sr-only">Ir para as mensagens mais recentes</span>
          </MessageScrollerButton>
        </MessageScroller>
      </RenderIf>
      <RenderIf shouldRender={changeError}>
        <div className="shrink-0 px-4 pb-2 md:px-8">
          <FormError message={changeError ? getApiErrorMessage(changeError) : null} />
        </div>
      </RenderIf>
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
