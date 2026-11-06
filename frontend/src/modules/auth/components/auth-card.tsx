import type { ReactNode } from 'react';
import { Brand } from '@/components/layout/brand';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Brand />
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">{children}</div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}
