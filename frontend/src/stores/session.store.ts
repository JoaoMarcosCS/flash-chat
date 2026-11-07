import { create } from 'zustand';

export interface SessionUser {
  id: string;
  name: string;
  nickname: string;
}

export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface Session {
  accessToken: string;
  expiresAt: number;
  user: SessionUser;
}

interface SessionStore {
  status: SessionStatus;
  accessToken: string | null;
  expiresAt: number | null;
  user: SessionUser | null;
  setSession: (session: Session) => void;
  updateUser: (user: Pick<SessionUser, 'name' | 'nickname'>) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  status: 'unknown',
  accessToken: null,
  expiresAt: null,
  user: null,
  setSession: (session) => set({ status: 'authenticated', ...session }),
  updateUser: (user) => set((state) => ({ user: state.user && { ...state.user, ...user } })),
  clearSession: () =>
    set({ status: 'unauthenticated', accessToken: null, expiresAt: null, user: null }),
}));
