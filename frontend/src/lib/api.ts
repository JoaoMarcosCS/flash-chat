import axios from 'axios';
import { env } from '@/environment/env';
import { refreshSession } from '@/modules/auth/session/session';
import { useSessionStore } from '@/stores/session.store';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    retried?: boolean;
  }
}

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const { accessToken } = useSessionStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  const config = axios.isAxiosError(error) ? error.config : undefined;

  if (!config || error.response?.status !== 401 || config.retried) throw error;

  config.retried = true;
  await refreshSession();

  return api.request(config);
});
