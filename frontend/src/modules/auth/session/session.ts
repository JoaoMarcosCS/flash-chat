import { jwtDecode } from 'jwt-decode';
import { refreshRequest } from '../service/refresh.request';
import { clearSessionCookie, setSessionCookie } from './session-cookie';
import { useSessionStore } from '@/stores/session.store';

interface AccessTokenPayload {
  sub: string;
  name: string;
  nickname: string;
  exp: number;
}

const REFRESH_LOCK = 'flash-chat.refresh';

let pendingRefresh: Promise<void> | null = null;

export function startSession(accessToken: string) {
  const { sub, name, nickname, exp } = jwtDecode<AccessTokenPayload>(accessToken);
  useSessionStore.getState().setSession({
    accessToken,
    expiresAt: exp * 1000,
    user: { id: sub, name, nickname },
  });
  setSessionCookie();
}

export function endSession() {
  useSessionStore.getState().clearSession();
  clearSessionCookie();
}

export function isAccessTokenExpired(): boolean {
  const { expiresAt } = useSessionStore.getState();
  return !expiresAt || expiresAt <= Date.now();
}

async function runRefresh(): Promise<void> {
  try {
    const { accessToken } = await navigator.locks.request(REFRESH_LOCK, refreshRequest);
    startSession(accessToken);
  } catch (error) {
    endSession();
    throw error;
  }
}

export function refreshSession(): Promise<void> {
  pendingRefresh ??= runRefresh().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}
