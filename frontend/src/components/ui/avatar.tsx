import { Users } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';
import { getUserTone } from '@/lib/user-tone';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-12 text-sm',
};

interface AvatarProps {
  id: string;
  name: string;
  isGroup?: boolean;
  size?: keyof typeof sizes;
  className?: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({ id, name, isGroup = false, size = 'md', className }: AvatarProps) {
  const tone = getUserTone(id);

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none',
        isGroup
          ? 'bg-surface text-foreground ring-1 ring-inset ring-foreground'
          : [tone.soft, tone.ink],
        sizes[size],
        className,
      )}
    >
      <RenderIf shouldRender={isGroup} fallback={getInitials(name)}>
        <Users className="size-[45%]" strokeWidth={1.75} />
      </RenderIf>
    </span>
  );
}
