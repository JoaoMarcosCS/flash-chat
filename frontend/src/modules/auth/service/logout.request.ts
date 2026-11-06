import { publicApi } from '@/lib/public-api';

export async function logoutRequest(): Promise<void> {
  await publicApi.post('/auth/logout');
}
