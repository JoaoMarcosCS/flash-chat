import axios from 'axios';
import { env } from '@/environment/env';

export const publicApi = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});
