'use client';

import type { ReactNode } from 'react';
import { useSelectedLayoutSegment } from 'next/navigation';
import type { ChatType } from '../interface/chat.interface';
import { ChatsSidebar } from './chats-sidebar';
import { RenderIf } from '@/components/common/render-if';
import { cn } from '@/lib/utils';

interface ChatsSplitViewProps {
  type: ChatType;
  children: ReactNode;
}

export function ChatsSplitView({ type, children }: ChatsSplitViewProps) {
  const hasSelection = useSelectedLayoutSegment() !== null;

  return (
    <>
      <RenderIf shouldRender={!hasSelection}>
        <ChatsSidebar type={type} className="w-full md:hidden" />
      </RenderIf>
      <section
        className={cn('min-h-0 min-w-0 flex-1 flex-col', hasSelection ? 'flex' : 'hidden md:flex')}
      >
        {children}
      </section>
    </>
  );
}
