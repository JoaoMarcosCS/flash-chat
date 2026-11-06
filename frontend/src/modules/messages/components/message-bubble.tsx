import type { ChatMessage } from '../interface/message.interface';
import { MessageStatusIcon } from './message-status-icon';
import { RenderIf } from '@/components/common/render-if';
import { Avatar } from '@/components/ui/avatar';
import { formatTime } from '@/lib/format-date';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
  isGroup: boolean;
  onRetry: () => void;
  onDiscard: () => void;
}

export function MessageBubble({
  message,
  isOwn,
  showSender,
  isGroup,
  onRetry,
  onDiscard,
}: MessageBubbleProps) {
  const { status } = message;

  return (
    <div className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      <RenderIf shouldRender={isGroup && !isOwn}>
        <RenderIf shouldRender={showSender} fallback={<span className="w-8 shrink-0" />}>
          <Avatar id={message.sender.id} name={message.sender.name} size="sm" />
        </RenderIf>
      </RenderIf>
      <div className={cn('flex max-w-[78%] flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-[18px] px-3.5 py-2',
            isOwn
              ? 'rounded-br-[4px] bg-inverse text-inverse-foreground'
              : 'rounded-bl-[4px] border border-border bg-surface text-foreground',
            status === 'failed' &&
              'bg-surface text-foreground outline-1 outline-foreground outline-dashed',
          )}
        >
          <RenderIf shouldRender={isGroup && !isOwn && showSender}>
            <p className="mb-0.5 text-[13px] font-semibold">{message.sender.name}</p>
          </RenderIf>
          <p className="text-[15px] leading-[1.4] wrap-break-word whitespace-pre-wrap">
            {message.content}
          </p>
          <p
            className={cn(
              'mt-0.5 flex items-center justify-end gap-1 text-[11px] tabular-nums',
              isOwn && status !== 'failed' ? 'text-inverse-foreground/65' : 'text-muted-foreground',
            )}
          >
            <time dateTime={message.createdAt}>{formatTime(new Date(message.createdAt))}</time>
            <RenderIf shouldRender={isOwn && status}>
              {status && <MessageStatusIcon status={status} />}
            </RenderIf>
          </p>
        </div>
        <RenderIf shouldRender={status === 'failed'}>
          <p className="mt-1 flex items-center gap-3 px-1 text-xs">
            <span className="text-muted-foreground">Não enviada</span>
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer font-medium text-foreground underline-offset-2 hover:underline"
            >
              Reenviar
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="cursor-pointer font-medium text-muted-foreground underline-offset-2 hover:underline"
            >
              Descartar
            </button>
          </p>
        </RenderIf>
      </div>
    </div>
  );
}
