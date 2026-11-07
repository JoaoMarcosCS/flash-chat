import { useMutation } from '@tanstack/react-query';
import { deactivateUserRequest } from '../service/deactivate-user.request';
import { useEndSession } from '@/modules/auth/hooks/use-end-session';

export function useDeactivateUserMutation() {
  const endSession = useEndSession();

  return useMutation({
    mutationFn: deactivateUserRequest,
    onSuccess: endSession,
  });
}
