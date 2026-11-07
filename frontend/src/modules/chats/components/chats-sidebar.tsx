'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleUserRound, Search, SquarePen, UserRoundPlus } from 'lucide-react';
import type { ChatType } from '../interface/chat.interface';
import { ChatList } from './chat-list';
import { ChatTypeTabs } from './chat-type-tabs';
import { buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { SEARCH_MAX_LENGTH, toSearchTerm } from '@/lib/search-term';
import { LogoutButton } from '@/modules/auth/components/logout-button';

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
}

export function ChatsSidebar({ type }: ChatsSidebarProps) {
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(toSearchTerm(search));
  const { title, createLabel, createHref, CreateIcon, searchLabel } = SIDEBAR_CONTENT[type];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 px-5 pt-6 pb-4">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
        <div className="flex items-center gap-1">
          <Link
            href={createHref}
            aria-label={createLabel}
            title={createLabel}
            className={buttonClassName({ variant: 'ghost', size: 'icon' })}
          >
            <CreateIcon className="size-5" />
          </Link>
          <Link
            href="/profile"
            aria-label="Perfil"
            title="Perfil"
            className={buttonClassName({ variant: 'ghost', size: 'icon', className: 'md:hidden' })}
          >
            <CircleUserRound className="size-5" />
          </Link>
          <LogoutButton className="md:hidden" />
        </div>
      </header>
      <div className="px-5 pb-3 md:hidden">
        <ChatTypeTabs active={type} />
      </div>
      <div className="px-5 pb-3">
        <label className="relative block">
          <span className="sr-only">{searchLabel}</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`${searchLabel}...`}
            className="pl-10"
          />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <ChatList type={type} search={term} />
      </div>
    </div>
  );
}
