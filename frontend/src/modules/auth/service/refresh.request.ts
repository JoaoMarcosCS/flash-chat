import { publicApi } from '@/lib/public-api';

interface RefreshResponse {
  accessToken: string;
}

export async function refreshRequest(): Promise<RefreshResponse> {
  const { data } = await publicApi.post<RefreshResponse>('/auth/refresh');
  return data;
}
