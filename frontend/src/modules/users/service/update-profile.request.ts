import type { UserProfile } from '../interface/user.interface';
import { api } from '@/lib/api';

export interface UpdateProfileBody {
  name?: string;
  nickname?: string;
  email?: string;
  password?: string;
  currentPassword: string;
}

export async function updateProfileRequest(body: UpdateProfileBody): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/users/me', body);
  return data;
}
