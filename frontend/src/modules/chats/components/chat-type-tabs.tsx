import Link from 'next/link';
import { getChatTypePath } from '../display/chat-display';
import type { ChatType } from '../interface/chat.interface';
import { RenderItems } from '@/components/common/render-items';
import { cn } from '@/lib/utils';

const TABS: { type: ChatType; label: string }[] = [
  { type: 'direct', label: 'Conversas' },
  { type: 'group', label: 'Grupos' },
];

interface ChatTypeTabsProps {
  active: ChatType;
}

export function ChatTypeTabs({ active }: ChatTypeTabsProps) {
  return (
    <nav aria-label="Tipo de conversa" className="flex gap-1 rounded-lg bg-muted p-1">
      <RenderItems items={TABS} getKey={(tab) => tab.type}>
        {(tab) => (
          <Link
            href={getChatTypePath(tab.type)}
            aria-current={tab.type === active ? 'page' : undefined}
            className={cn(
              'flex h-8 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors duration-150',
              tab.type === active
                ? 'bg-surface text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )}
      </RenderItems>
    </nav>
  );
}
