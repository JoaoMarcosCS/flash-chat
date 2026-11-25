'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronsUpDown, CircleUserRound, LogOut } from 'lucide-react';
import { useLogout } from '../hooks/use-logout';
import { RenderIf } from '@/components/common/render-if';
import { UserAvatar } from '@/components/common/user-avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSessionStore } from '@/stores/session.store';

export function NavUser() {
  const user = useSessionStore((state) => state.user);
  const { isMobile } = useSidebar();
  const logout = useLogout();
  const [confirming, setConfirming] = useState(false);

  const confirm = () => {
    setConfirming(false);
    logout.mutate();
  };

  return (
    <RenderIf shouldRender={user}>
      {user && (
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="md:h-8 md:p-0 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                  />
                }
              >
                <UserAvatar id={user.id} name={user.name} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">@{user.nickname}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <UserAvatar id={user.id} name={user.name} />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium text-foreground">{user.name}</span>
                        <span className="truncate text-xs">@{user.nickname}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/profile" />}>
                    <CircleUserRound />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={logout.isPending} onClick={() => setConfirming(true)}>
                    <LogOut />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <ConfirmDialog
              open={confirming}
              title="Sair da conta?"
              description="Você vai precisar entrar de novo com e-mail e senha."
              confirmLabel="Sair"
              onConfirm={confirm}
              onCancel={() => setConfirming(false)}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </RenderIf>
  );
}
