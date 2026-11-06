'use client';

import type { ReactNode } from 'react';
import { useSelectedLayoutSegment } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ChatsSplitViewProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function ChatsSplitView({ sidebar, children }: ChatsSplitViewProps) {
  const hasSelection = useSelectedLayoutSegment() !== null;

  return (
    <div className="flex h-full min-h-0 flex-1">
      <aside
        className={cn(
          'w-full shrink-0 border-r border-border bg-surface md:block md:w-[360px]',
          hasSelection ? 'hidden' : 'block',
        )}
      >
        {sidebar}
      </aside>
      <section className={cn('min-w-0 flex-1 flex-col md:flex', hasSelection ? 'flex' : 'hidden')}>
        {children}
      </section>
    </div>
  );
}
