'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SquarePen, UserRoundPlus } from 'lucide-react';
import type { ChatType } from '../interface/chat.interface';
import { ChatList } from './chat-list';
import { buttonVariants } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { SEARCH_MAX_LENGTH, toSearchTerm } from '@/lib/search-term';
import { cn } from '@/lib/utils';

const SIDEBAR_CONTENT = {
  direct: {
    title: 'Conversas',
    createLabel: 'Nova conversa',
    createHref: '/chats/new',
    CreateIcon: SquarePen,
    searchLabel: 'Buscar conversas',
  },
  group: {
    title: 'Grupos',
    createLabel: 'Novo grupo',
    createHref: '/groups/new',
    CreateIcon: UserRoundPlus,
    searchLabel: 'Buscar grupos',
  },
};

interface ChatsSidebarProps {
  type: ChatType;
  className?: string;
}

export function ChatsSidebar({ type, className }: ChatsSidebarProps) {
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(toSearchTerm(search));
  const { title, createLabel, createHref, CreateIcon, searchLabel } = SIDEBAR_CONTENT[type];

  return (
    <Sidebar collapsible="none" className={cn('min-h-0 min-w-0 flex-1', className)}>
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center gap-2">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <h1 className="text-base font-medium text-foreground">{title}</h1>
          <Link
            href={createHref}
            aria-label={createLabel}
            title={createLabel}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'ml-auto')}
          >
            <CreateIcon />
          </Link>
        </div>
        <label className="block">
          <span className="sr-only">{searchLabel}</span>
          <SidebarInput
            type="search"
            value={search}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`${searchLabel}...`}
          />
        </label>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupContent>
            <ChatList type={type} search={term} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
