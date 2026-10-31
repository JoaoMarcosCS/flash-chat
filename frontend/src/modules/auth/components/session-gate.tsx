'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { refreshSession } from '../session/session';
import { RenderIf } from '@/components/common/render-if';
import { useSessionStore } from '@/stores/session.store';

interface SessionGateProps {
  children: ReactNode;
}

export function SessionGate({ children }: SessionGateProps) {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status === 'unknown') refreshSession().catch(() => undefined);
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  return <RenderIf shouldRender={status === 'authenticated'}>{children}</RenderIf>;
}
