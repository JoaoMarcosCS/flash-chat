import { create } from 'zustand';
import type { ConnectionStatus } from '../interface/realtime-event.interface';

interface ConnectionStore {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

export const useConnectionStore = create<ConnectionStore>()((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
}));
