import { Pencil, Trash2 } from 'lucide-react';
import { DELETED_MESSAGE_LABEL, isDeleted } from '../display/message-display';
import type { ChatMessage } from '../interface/message.interface';
import { MessageEditForm } from './message-edit-form';
import { MessageStatusIcon } from './message-status-icon';
import { RenderIf } from '@/components/common/render-if';
import { UserAvatar } from '@/components/common/user-avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '@/components/ui/message';
import { formatTime } from '@/lib/format-date';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  withAvatar: boolean;
  showAvatar: boolean;
  showHeader: boolean;
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

export function MessageItem({
  message,
  isOwn,
  withAvatar,
  showAvatar,
  showHeader,
  canChange,
  isEditing,
  isSaving,
  onRetry,
  onDiscard,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: MessageItemProps) {
  const { status } = message;
  const deleted = isDeleted(message);
  const failed = status === 'failed';
  const editedAt = !deleted && message.contentStatus === 'edited' ? message.editedAt : null;
  const filled = isOwn && !failed && !deleted;

  return (
    <Message align={isOwn ? 'end' : 'start'}>
      <RenderIf shouldRender={withAvatar}>
        <MessageAvatar className="bg-transparent">
          <RenderIf shouldRender={showAvatar}>
            <UserAvatar id={message.sender.id} name={message.sender.name} />
          </RenderIf>
        </MessageAvatar>
      </RenderIf>
      <MessageContent className="gap-1">
        <RenderIf shouldRender={showHeader}>
          <MessageHeader className="text-foreground">{message.sender.name}</MessageHeader>
        </RenderIf>
        <RenderIf
          shouldRender={isEditing}
          fallback={
            <Bubble
              variant={filled ? 'default' : 'outline'}
              className={cn(
                !filled && '*:data-[slot=bubble-content]:bg-card',
                failed &&
                  '*:data-[slot=bubble-content]:border-dashed *:data-[slot=bubble-content]:border-foreground',
              )}
            >
              <BubbleContent
                className={cn(
                  'text-[15px] whitespace-pre-wrap',
                  deleted && 'text-muted-foreground italic',
                )}
              >
                {deleted ? DELETED_MESSAGE_LABEL : message.content}
              </BubbleContent>
            </Bubble>
          }
        >
          <MessageEditForm
            initialContent={message.content ?? ''}
            isSaving={isSaving}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        </RenderIf>
        <MessageFooter className="min-h-6 gap-1.5 tabular-nums">
          <RenderIf shouldRender={canChange && !isEditing}>
            <div className="flex gap-0.5 opacity-0 transition-opacity duration-150 group-focus-within/message:opacity-100 group-hover/message:opacity-100 pointer-coarse:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Editar mensagem"
                title="Editar"
                onClick={onStartEdit}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Apagar mensagem"
                title="Apagar"
                onClick={onDelete}
              >
                <Trash2 />
              </Button>
            </div>
          </RenderIf>
          <RenderIf shouldRender={failed}>
            <span>Não enviada</span>
            <Button variant="ghost" size="xs" onClick={onRetry} className="text-foreground">
              Reenviar
            </Button>
            <Button variant="ghost" size="xs" onClick={onDiscard}>
              Descartar
            </Button>
          </RenderIf>
          <time dateTime={message.createdAt}>{formatTime(new Date(message.createdAt))}</time>
          <RenderIf shouldRender={editedAt}>
            <time dateTime={editedAt ?? undefined}>
              · editada às {editedAt ? formatTime(new Date(editedAt)) : ''}
            </time>
          </RenderIf>
          <RenderIf shouldRender={isOwn && status && !deleted}>
            {status && <MessageStatusIcon status={status} />}
          </RenderIf>
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}
