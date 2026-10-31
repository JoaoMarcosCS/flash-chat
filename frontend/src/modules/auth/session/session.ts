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
  const { sub, name, nickname } = jwtDecode<AccessTokenPayload>(accessToken);
  useSessionStore.getState().setSession(accessToken, { id: sub, name, nickname });
  setSessionCookie();
}

export function endSession() {
  useSessionStore.getState().clearSession();
  clearSessionCookie();
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
