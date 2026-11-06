'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MessageSquareText, Users } from 'lucide-react';
import { Brand } from './brand';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogout } from '@/modules/auth/hooks/use-logout';
import { ConnectionIndicator } from '@/modules/realtime/components/connection-indicator';
import { useSessionStore } from '@/stores/session.store';

const NAV_ITEMS = [
  { href: '/chats', label: 'Conversas', Icon: MessageSquareText },
  { href: '/groups', label: 'Grupos', Icon: Users },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const user = useSessionStore((state) => state.user);
  const logout = useLogout();

  return (
    <div className="flex h-dvh overflow-hidden">
      <nav className="hidden w-[72px] shrink-0 flex-col items-center gap-8 border-r border-border bg-surface py-5 md:flex">
        <Brand showName={false} />
        <div className="flex w-full flex-col gap-2">
          <RenderItems items={NAV_ITEMS} getKey={(item) => item.href}>
            {({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors duration-150',
                    active
                      ? 'text-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:bg-inverse'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {label}
                </Link>
              );
            }}
          </RenderItems>
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <RenderIf shouldRender={user}>
            {user && (
              <span title={`${user.name} (@${user.nickname})`}>
                <Avatar id={user.id} name={user.name} />
              </span>
            )}
          </RenderIf>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            title="Sair"
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-[18px]" strokeWidth={1.75} />
          </Button>
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <ConnectionIndicator />
        {children}
      </div>
    </div>
  );
}
