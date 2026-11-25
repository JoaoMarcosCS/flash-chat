import type { ReactNode } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Brand } from '@/components/layout/brand';
import { FieldDescription } from '@/components/ui/field';

interface AuthCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="grid min-h-svh flex-1 bg-surface lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <Link href="/login" aria-label="Flash Chat">
            <Brand />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-xs flex-col gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
              <p className="text-sm text-balance text-muted-foreground">{description}</p>
            </div>
            {children}
            <FieldDescription className="text-center">{footer}</FieldDescription>
          </div>
        </div>
      </div>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-inverse p-10 text-inverse-foreground lg:flex">
        <Zap
          aria-hidden
          className="absolute -right-24 -bottom-24 size-[36rem] text-inverse-foreground/10"
          strokeWidth={0.75}
        />
        <span className="text-sm font-medium text-inverse-foreground/70">Flash Chat</span>
        <p className="relative max-w-sm text-3xl font-semibold tracking-[-0.02em] text-balance">
          Conversas diretas e em grupo, entregues na hora.
        </p>
      </div>
    </main>
  );
}
