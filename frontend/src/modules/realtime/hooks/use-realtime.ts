import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { handleRealtimeEvent } from '../handler/handle-realtime-event';
import { RealtimeSocket } from '../socket/realtime-socket';
import { useConnectionStore } from '../store/connection.store';
import { useEndSession } from '@/modules/auth/hooks/use-end-session';
import { isAccessTokenExpired, refreshSession } from '@/modules/auth/session/session';
import { useSessionStore } from '@/stores/session.store';

export function useRealtime() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.user?.id);
  const endSession = useEndSession();

  useEffect(() => {
    if (!userId) return;

    const socket = new RealtimeSocket({
      getAccessToken: () => useSessionStore.getState().accessToken,
      isAccessTokenExpired,
      refresh: refreshSession,
      onEvent: (event) => handleRealtimeEvent(queryClient, event, userId),
      onStatus: (status) => useConnectionStore.getState().setStatus(status),
      onReconnect: () => {
        void queryClient.invalidateQueries({ queryKey: ['chats'] });
        void queryClient.invalidateQueries({ queryKey: ['messages'] });
      },
      onDeactivated: endSession,
    });

    socket.start();
    return () => socket.stop();
  }, [queryClient, userId, endSession]);
}
