'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleUserRound, MessageSquareText, Users, Zap } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavUser } from '@/modules/auth/components/nav-user';
import { ChatsSidebar } from '@/modules/chats/components/chats-sidebar';
import type { ChatType } from '@/modules/chats/interface/chat.interface';
import { ConnectionIndicator } from '@/modules/realtime/components/connection-indicator';

const NAV_ITEMS = [
  { href: '/chats', label: 'Conversas', Icon: MessageSquareText },
  { href: '/groups', label: 'Grupos', Icon: Users },
  { href: '/profile', label: 'Perfil', Icon: CircleUserRound },
];

const SIDEBAR_STYLE = { '--sidebar-width': '380px' } as CSSProperties;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getChatType(pathname: string): ChatType | null {
  if (isActive(pathname, '/chats')) return 'direct';
  if (isActive(pathname, '/groups')) return 'group';
  return null;
}

interface NavRailProps {
  pathname: string;
  onNavigate: () => void;
}

function NavRail({ pathname, onNavigate }: NavRailProps) {
  const { setOpenMobile } = useSidebar();

  const navigate = () => {
    onNavigate();
    setOpenMobile(false);
  };

  return (
    <Sidebar
      collapsible="none"
      className="w-full border-r md:w-[calc(var(--sidebar-width-icon)+1px)]!"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="md:h-8 md:p-0"
              render={<Link href="/chats" onClick={navigate} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Zap className="size-4 fill-current" strokeWidth={1.5} />
              </div>
              <span className="truncate font-semibold tracking-[-0.02em]">Flash Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu className="gap-2.5">
              <RenderItems items={NAV_ITEMS} getKey={(item) => item.href}>
                {({ href, label, Icon }) => (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={{ children: label, hidden: false }}
                      isActive={isActive(pathname, href)}
                      className="px-2.5 md:px-2"
                      render={<Link href={href} onClick={navigate} />}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </RenderItems>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const chatType = getChatType(pathname);
  const [inboxOpen, setInboxOpen] = useState(true);

  return (
    <SidebarProvider
      open={chatType !== null && inboxOpen}
      onOpenChange={setInboxOpen}
      style={SIDEBAR_STYLE}
      className="h-dvh min-h-0 overflow-hidden"
    >
      <Sidebar collapsible="icon" className="overflow-hidden *:data-[sidebar=sidebar]:flex-row">
        <NavRail pathname={pathname} onNavigate={() => setInboxOpen(true)} />
        <RenderIf shouldRender={chatType}>
          {chatType && <ChatsSidebar key={chatType} type={chatType} className="hidden md:flex" />}
        </RenderIf>
      </Sidebar>
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <ConnectionIndicator />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
