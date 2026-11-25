'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useProactiveRefresh } from '../hooks/use-proactive-refresh';
import { refreshSession } from '../session/session';
import { RenderIf } from '@/components/common/render-if';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionStore } from '@/stores/session.store';

interface SessionGateProps {
  children: ReactNode;
}

function AppSkeleton() {
  return (
    <div aria-busy aria-label="Carregando" className="flex h-dvh flex-1">
      <div className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r bg-sidebar py-3 md:flex">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="mt-3 size-8" />
        <Skeleton className="size-8" />
        <Skeleton className="size-8" />
        <Skeleton className="mt-auto size-8 rounded-full" />
      </div>
      <div className="hidden w-[340px] shrink-0 flex-col gap-3 border-r bg-sidebar p-4 md:flex">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2 py-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center gap-3 border-b bg-surface px-4">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

export function SessionGate({ children }: SessionGateProps) {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);

  useProactiveRefresh();

  useEffect(() => {
    if (status === 'unknown') refreshSession().catch(() => undefined);
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  return (
    <RenderIf shouldRender={status === 'authenticated'} fallback={<AppSkeleton />}>
      {children}
    </RenderIf>
  );
}
