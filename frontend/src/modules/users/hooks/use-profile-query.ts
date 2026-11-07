import { useQuery } from '@tanstack/react-query';
import { findProfileRequest } from '../service/find-profile.request';

export const profileQueryKey = ['profile'] as const;

export function useProfileQuery() {
  return useQuery({ queryKey: profileQueryKey, queryFn: findProfileRequest });
}
