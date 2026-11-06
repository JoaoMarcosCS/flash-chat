import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logoutRequest } from '../service/logout.request';
import { endSession } from '../session/session';
import { useLiveMessagesStore } from '@/modules/messages/store/live-messages.store';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      endSession();
      queryClient.clear();
      useLiveMessagesStore.getState().clear();
    },
  });
}
