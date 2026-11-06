import { X } from 'lucide-react';
import type { Chat } from '../interface/chat.interface';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';

interface ParticipantsPanelProps {
  chat: Chat;
  currentUserId: string;
  onClose: () => void;
}

export function ParticipantsPanel({ chat, currentUserId, onClose }: ParticipantsPanelProps) {
  const title = chat.isGroup ? `Participantes (${chat.participants.length})` : 'Detalhes';
  const participants = chat.isGroup
    ? chat.participants
    : chat.participants.filter((participant) => participant.id !== currentUserId);

  return (
    <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-sm flex-col border-l border-border bg-surface shadow-[-16px_0_40px_-24px_rgb(0_0_0/0.25)]">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Button variant="ghost" size="icon-sm" aria-label="Fechar" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </header>
      <ul className="flex-1 overflow-y-auto px-3 pb-4">
        <RenderItems items={participants} getKey={(participant) => participant.id}>
          {(participant) => {
            const isCurrentUser = participant.id === currentUserId;

            return (
              <li className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Avatar id={participant.id} name={participant.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-0.5">
                    <p className="truncate font-medium text-foreground">
                      {isCurrentUser ? 'Você' : participant.name}
                    </p>
                    <RenderIf shouldRender={!isCurrentUser}>
                      <CopyButton value={participant.name} label="Copiar nome" />
                    </RenderIf>
                  </div>
                  <div className="flex min-w-0 items-center gap-0.5">
                    <p className="truncate text-sm text-muted-foreground">@{participant.nickname}</p>
                    <RenderIf shouldRender={!isCurrentUser}>
                      <CopyButton value={participant.nickname} label="Copiar Nickname" />
                    </RenderIf>
                  </div>
                </div>
              </li>
            );
          }}
        </RenderItems>
      </ul>
    </aside>
  );
}
