import { useEffect } from 'react';
import { refreshSession } from '../session/session';
import { useSessionStore } from '@/stores/session.store';

const REFRESH_BEFORE_EXPIRATION_MS = 60_000;

export function useProactiveRefresh() {
  const expiresAt = useSessionStore((state) => state.expiresAt);

  useEffect(() => {
    if (!expiresAt) return;

    const delay = Math.max(expiresAt - Date.now() - REFRESH_BEFORE_EXPIRATION_MS, 0);
    const timer = setTimeout(() => refreshSession().catch(() => undefined), delay);

    return () => clearTimeout(timer);
  }, [expiresAt]);
}
