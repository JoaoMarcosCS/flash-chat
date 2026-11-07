import type { UserProfile } from '../interface/user.interface';
import { api } from '@/lib/api';

export async function findProfileRequest(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/users/me');
  return data;
}
