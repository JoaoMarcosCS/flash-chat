import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileQueryKey } from './use-profile-query';
import { updateProfileRequest } from '../service/update-profile.request';
import { useSessionStore } from '@/stores/session.store';

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
      useSessionStore.getState().updateUser({ name: profile.name, nickname: profile.nickname });
    },
  });
}
