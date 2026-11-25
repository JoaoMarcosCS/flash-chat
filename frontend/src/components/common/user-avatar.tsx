import { Users } from 'lucide-react';
import { RenderIf } from './render-if';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUserTone } from '@/lib/user-tone';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  id: string;
  name: string;
  isGroup?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function UserAvatar({
  id,
  name,
  isGroup = false,
  size = 'default',
  className,
}: UserAvatarProps) {
  const tone = getUserTone(id);

  return (
    <Avatar size={size} aria-hidden className={className}>
      <AvatarFallback
        className={cn(
          'text-xs font-medium',
          isGroup
            ? 'bg-surface text-foreground ring-1 ring-foreground ring-inset'
            : [tone.soft, tone.ink],
        )}
      >
        <RenderIf shouldRender={isGroup} fallback={getInitials(name)}>
          <Users className="size-[45%]" strokeWidth={1.75} />
        </RenderIf>
      </AvatarFallback>
    </Avatar>
  );
}
