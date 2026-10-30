import { beforeEach, describe, expect, it } from 'vitest';
import { container } from 'tsyringe';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { verifyAccessToken, verifyRefreshToken } from '@/modules/auth/token/token';
import { createAuthUser, login, refreshCookie, setCookies } from './auth-fixtures';

describe('POST /api/v1/auth/login (integração)', () => {
  let user: { id: string; email: string };

  beforeEach(async () => {
    user = await createAuthUser();
  });

  it('should return the access token in the body and the refresh token in a cookie', async () => {
    const response = await login(user.email);

    expect(response.status).toBe(200);
    expect(Object.keys(response.body)).toEqual(['accessToken']);
    expect(verifyAccessToken(response.body.accessToken)?.id).toBe(user.id);

    const [cookie] = setCookies(response);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api/v1/auth');
    expect(Number(/Max-Age=(\d+)/.exec(cookie)?.[1])).toBeCloseTo(7 * 24 * 60 * 60, -1);
    expect(cookie).not.toContain('Secure');
  });

  it('should save the session in redis', async () => {
    const response = await login(user.email);
    const payload = verifyRefreshToken(refreshCookie(response).split('=')[1]);

    expect(
      await container
        .resolve<ICacheProvider>('ICacheProvider')
        .get(`auth:refresh:${payload?.sessionId}`),
    ).toBe(user.id);
  });

  it.each([
    ['a wrong password', () => login(user.email, '@Wrong123')],
    ['an unknown e-mail', () => login('bruno@example.com')],
  ])('should return 401 for %s', async (_, request) => {
    const response = await request();

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Credenciais inválidas');
    expect(setCookies(response)).toEqual([]);
  });

  it('should return 400 for an invalid e-mail', async () => {
    const response = await login('invalid');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('E-mail inválido');
  });
});
