import { useMutation } from '@tanstack/react-query';
import { logoutRequest } from '../service/logout.request';
import { useEndSession } from './use-end-session';

export function useLogout() {
  const endSession = useEndSession();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: endSession,
  });
}
