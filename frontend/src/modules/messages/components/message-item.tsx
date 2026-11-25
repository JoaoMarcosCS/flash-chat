import { Pencil, Trash2 } from 'lucide-react';
import { DELETED_MESSAGE_LABEL, isDeleted } from '../display/message-display';
import type { ChatMessage } from '../interface/message.interface';
import { MessageEditForm } from './message-edit-form';
import { MessageStatusIcon } from './message-status-icon';
import { RenderIf } from '@/components/common/render-if';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/format-date';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
  isGroup: boolean;
  canChange: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onRetry: () => void;
  onDiscard: () => void;
  onStartEdit: () => void;
  onSaveEdit: (content: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

export function MessageBubble({
  message,
  isOwn,
  showSender,
  isGroup,
  canChange,
  isEditing,
  isSaving,
  onRetry,
  onDiscard,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: MessageBubbleProps) {
  const { status } = message;
  const deleted = isDeleted(message);
  const editedAt = !deleted && message.contentStatus === 'edited' ? message.editedAt : null;
  const editedTime = editedAt ? formatTime(new Date(editedAt)) : '';

  return (
    <div className={cn('group flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      <RenderIf shouldRender={isGroup && !isOwn}>
        <RenderIf shouldRender={showSender} fallback={<span className="w-8 shrink-0" />}>
          <Avatar id={message.sender.id} name={message.sender.name} size="sm" />
        </RenderIf>
      </RenderIf>
      <RenderIf shouldRender={canChange && !isEditing}>
        <div className="flex shrink-0 gap-0.5 self-center opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar mensagem"
            onClick={onStartEdit}
            className="text-muted-foreground"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Apagar mensagem"
            onClick={onDelete}
            className="text-muted-foreground"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </RenderIf>
      <div className={cn('flex max-w-[78%] flex-col', isOwn ? 'items-end' : 'items-start')}>
        <RenderIf
          shouldRender={isEditing}
          fallback={
            <div
              className={cn(
                'rounded-[18px] px-3.5 py-2',
                isOwn
                  ? 'rounded-br-[4px] bg-inverse text-inverse-foreground'
                  : 'rounded-bl-[4px] border border-border bg-surface text-foreground',
                status === 'failed' &&
                  'bg-surface text-foreground outline-1 outline-foreground outline-dashed',
                deleted && 'border border-border bg-surface text-muted-foreground',
              )}
            >
              <RenderIf shouldRender={isGroup && !isOwn && showSender}>
                <p className="mb-0.5 text-xs font-semibold text-foreground">
                  {message.sender.name}
                </p>
              </RenderIf>
              <RenderIf
                shouldRender={!deleted}
                fallback={
                  <p className="text-[15px] leading-[1.4] italic">{DELETED_MESSAGE_LABEL}</p>
                }
              >
                <p className="text-[15px] leading-[1.4] wrap-break-word whitespace-pre-wrap">
                  {message.content}
                </p>
              </RenderIf>
              <p
                className={cn(
                  'mt-0.5 flex items-center justify-end gap-1 text-[11px] tabular-nums',
                  isOwn && status !== 'failed' && !deleted
                    ? 'text-inverse-foreground/65'
                    : 'text-muted-foreground',
                )}
              >
                <RenderIf shouldRender={editedAt}>
                  <time dateTime={editedAt ?? undefined}>editada às {editedTime} ·</time>
                </RenderIf>
                <time dateTime={message.createdAt}>{formatTime(new Date(message.createdAt))}</time>
                <RenderIf shouldRender={isOwn && status && !deleted}>
                  {status && <MessageStatusIcon status={status} />}
                </RenderIf>
              </p>
            </div>
          }
        >
          <MessageEditForm
            initialContent={message.content ?? ''}
            isSaving={isSaving}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        </RenderIf>
        <RenderIf shouldRender={status === 'failed'}>
          <p className="flex items-center gap-1 pl-1 text-xs">
            <span className="text-muted-foreground">Não enviada</span>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-8 cursor-pointer rounded-md px-2 font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Reenviar
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="min-h-8 cursor-pointer rounded-md px-2 font-medium text-muted-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              Descartar
            </button>
          </p>
        </RenderIf>
      </div>
    </div>
  );
}
