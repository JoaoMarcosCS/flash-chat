import { create } from 'zustand';

export interface SessionUser {
  id: string;
  name: string;
  nickname: string;
}

export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface SessionStore {
  status: SessionStatus;
  accessToken: string | null;
  user: SessionUser | null;
  setSession: (accessToken: string, user: SessionUser) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  status: 'unknown',
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ status: 'authenticated', accessToken, user }),
  clearSession: () => set({ status: 'unauthenticated', accessToken: null, user: null }),
}));
