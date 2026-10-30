import { CookieOptions, Request, Response } from 'express';
import { AuthTokens } from './token';
import { env } from '@/shared/environment/env';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.ENVIRONMENT === 'production',
  path: '/api/v1/auth',
};

export const readRefreshTokenCookie = (req: Request): string | undefined =>
  req.cookies?.[REFRESH_TOKEN_COOKIE];

export const setRefreshTokenCookie = (
  res: Response,
  { refreshToken, refreshExpiresAt }: AuthTokens,
): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: refreshExpiresAt - Date.now(),
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
};
