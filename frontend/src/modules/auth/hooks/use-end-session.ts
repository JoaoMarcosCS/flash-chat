import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { endSession } from '../session/session';
import { useLiveMessagesStore } from '@/modules/messages/store/live-messages.store';

export function useEndSession() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    endSession();
    queryClient.clear();
    useLiveMessagesStore.getState().clear();
  }, [queryClient]);
}
