import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface PanelHeaderProps {
  children: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  showSidebarTrigger?: boolean;
}

export function PanelHeader({
  children,
  actions,
  backHref = '/chats',
  showSidebarTrigger = true,
}: PanelHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-surface px-3 md:px-4">
      <Link
        href={backHref}
        aria-label="Voltar para a lista"
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden')}
      >
        <ArrowLeft />
      </Link>
      <RenderIf shouldRender={showSidebarTrigger}>
        <SidebarTrigger className="hidden md:inline-flex" />
        <Separator
          orientation="vertical"
          className="mr-1 hidden data-vertical:h-4 data-vertical:self-auto md:block"
        />
      </RenderIf>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {actions}
    </header>
  );
}
