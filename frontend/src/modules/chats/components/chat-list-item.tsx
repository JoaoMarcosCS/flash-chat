import Link from 'next/link';
import { Lock } from 'lucide-react';
import { getChatHref } from '../display/chat-display';
import type { ChatListItem as ChatListItemData } from '../interface/chat.interface';
import { RenderIf } from '@/components/common/render-if';
import { Avatar } from '@/components/ui/avatar';
import { formatListDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';
import { getUuidV7Date } from '@/lib/uuid-v7-date';
import { DELETED_MESSAGE_LABEL } from '@/modules/messages/display/message-display';

interface ChatListItemProps {
  chat: ChatListItemData;
  currentUserId: string;
  active: boolean;
}

function getPreviewPrefix(chat: ChatListItemData, currentUserId: string): string {
  const sender = chat.lastMessage?.sender;
  if (!sender) return '';
  if (sender.id === currentUserId) return 'Você: ';
  return chat.isGroup ? `${sender.name.split(' ')[0]}: ` : '';
}

export function ChatListItem({ chat, currentUserId, active }: ChatListItemProps) {
  const { lastMessage } = chat;

  return (
    <Link
      href={getChatHref(chat)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150',
        active
          ? 'bg-muted before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:bg-inverse'
          : 'hover:bg-muted/60',
      )}
    >
      <Avatar id={chat.id} name={chat.displayName} isGroup={chat.isGroup} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
            <span className="truncate">{chat.displayName}</span>
            <RenderIf shouldRender={chat.readOnly}>
              <Lock
                role="img"
                aria-label="Somente leitura"
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            </RenderIf>
          </p>
          <RenderIf shouldRender={lastMessage}>
            <time className="shrink-0 text-xs text-muted-foreground">
              {lastMessage && formatListDate(getUuidV7Date(lastMessage.id))}
            </time>
          </RenderIf>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          <RenderIf
            shouldRender={lastMessage}
            fallback={<span className="italic">Nenhuma mensagem ainda</span>}
          >
            {getPreviewPrefix(chat, currentUserId)}
            <RenderIf
              shouldRender={lastMessage?.content !== null}
              fallback={<span className="italic">{DELETED_MESSAGE_LABEL}</span>}
            >
              {lastMessage?.content}
            </RenderIf>
          </RenderIf>
        </p>
      </div>
    </Link>
  );
}
