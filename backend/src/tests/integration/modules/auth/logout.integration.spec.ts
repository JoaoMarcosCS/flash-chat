import { beforeEach, describe, expect, it } from 'vitest';
import { createAuthUser, login, logout, refresh, refreshCookie, setCookies } from './auth-fixtures';

describe('POST /api/v1/auth/logout (integração)', () => {
  let cookie: string;

  beforeEach(async () => {
    const user = await createAuthUser();
    cookie = refreshCookie(await login(user.email));
  });

  it('should revoke the session and clear the cookie', async () => {
    const response = await logout(cookie);

    expect(response.status).toBe(204);
    expect(setCookies(response).slice(-1)[0]).toContain('Expires=Thu, 01 Jan 1970');
    expect((await refresh(cookie)).status).toBe(401);
  });

  it('should end only the session of the given token', async () => {
    const otherSession = refreshCookie(await login('ana@example.com'));

    await logout(cookie);

    expect((await refresh(otherSession)).status).toBe(200);
  });

  it.each([
    ['without cookie', undefined],
    ['with an invalid token', 'refreshToken=invalid'],
  ])('should return 204 %s', async (_, invalidCookie) => {
    expect((await logout(invalidCookie)).status).toBe(204);
  });

  it('should return 204 when called twice', async () => {
    await logout(cookie);

    expect((await logout(cookie)).status).toBe(204);
  });
});
