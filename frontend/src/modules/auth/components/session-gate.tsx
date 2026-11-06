'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useProactiveRefresh } from '../hooks/use-proactive-refresh';
import { refreshSession } from '../session/session';
import { RenderIf } from '@/components/common/render-if';
import { Spinner } from '@/components/ui/spinner';
import { useSessionStore } from '@/stores/session.store';

interface SessionGateProps {
  children: ReactNode;
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
    <RenderIf
      shouldRender={status === 'authenticated'}
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-7" />
        </div>
      }
    >
      {children}
    </RenderIf>
  );
}
