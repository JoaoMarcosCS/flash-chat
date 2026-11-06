import type { LoginDTO } from '../schema/login.schema';
import { publicApi } from '@/lib/public-api';

interface LoginResponse {
  accessToken: string;
}

export async function loginRequest(body: LoginDTO): Promise<LoginResponse> {
  const { data } = await publicApi.post<LoginResponse>('/auth/login', body);
  return data;
}
