import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonClassName } from '@/components/ui/button';

interface PanelHeaderProps {
  children: ReactNode;
  actions?: ReactNode;
  backHref?: string;
}

export function PanelHeader({ children, actions, backHref = '/chats' }: PanelHeaderProps) {
  return (
    <header className="flex h-20 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 md:px-6">
      <Link
        href={backHref}
        aria-label="Voltar para a lista"
        className={buttonClassName({ variant: 'ghost', size: 'icon', className: 'md:hidden' })}
      >
        <ArrowLeft className="size-5" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {actions}
    </header>
  );
}
