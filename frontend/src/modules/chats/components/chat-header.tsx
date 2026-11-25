import { Info, Users } from 'lucide-react';
import {
  getChatDisplayName,
  getChatType,
  getChatTypePath,
  getOtherParticipant,
} from '../display/chat-display';
import type { Chat } from '../interface/chat.interface';
import { RenderIf } from '@/components/common/render-if';
import { UserAvatar } from '@/components/common/user-avatar';
import { PanelHeader } from '@/components/layout/panel-header';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  chat: Chat;
  currentUserId: string;
  participantsOpen: boolean;
  onToggleParticipants: () => void;
}

export function ChatHeader({
  chat,
  currentUserId,
  participantsOpen,
  onToggleParticipants,
}: ChatHeaderProps) {
  const displayName = getChatDisplayName(chat, currentUserId);
  const subtitle = chat.isGroup
    ? `${chat.participants.length} participantes`
    : `@${getOtherParticipant(chat, currentUserId)?.nickname ?? ''}`;
  const detailsLabel = chat.isGroup ? 'Ver participantes' : 'Ver detalhes';

  return (
    <PanelHeader
      backHref={getChatTypePath(getChatType(chat))}
      actions={
        <Button
          variant="ghost"
          size="icon"
          aria-label={detailsLabel}
          title={detailsLabel}
          aria-expanded={participantsOpen}
          aria-controls="participants-panel"
          onClick={onToggleParticipants}
        >
          <RenderIf shouldRender={chat.isGroup} fallback={<Info />}>
            <Users />
          </RenderIf>
        </Button>
      }
    >
      <UserAvatar id={chat.id} name={displayName} isGroup={chat.isGroup} size="lg" />
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-foreground">{displayName}</h2>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </PanelHeader>
  );
}
