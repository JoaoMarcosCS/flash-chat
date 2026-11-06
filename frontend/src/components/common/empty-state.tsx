import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { RenderIf } from './render-if';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Icon className="size-6 text-muted-foreground" strokeWidth={1.5} />
      <p className="font-medium text-foreground">{title}</p>
      <RenderIf shouldRender={description}>
        <p className="max-w-64 text-sm text-muted-foreground">{description}</p>
      </RenderIf>
      {action}
    </div>
  );
}
