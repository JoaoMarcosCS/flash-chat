import { AuthTokens } from './token';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';

export const sessionKey = (sessionId: string): string => `auth:refresh:${sessionId}`;

export const saveSession = (
  cache: ICacheProvider,
  userId: string,
  { sessionId, refreshExpiresAt }: AuthTokens,
): Promise<void> =>
  cache.set(sessionKey(sessionId), userId, Math.ceil((refreshExpiresAt - Date.now()) / 1000));
