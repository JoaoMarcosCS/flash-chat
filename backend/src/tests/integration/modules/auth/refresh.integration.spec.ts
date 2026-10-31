import { beforeEach, describe, expect, it } from 'vitest';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { generateTokens, verifyAccessToken } from '@/modules/auth/token/token';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { createAuthUser, login, refresh, refreshCookie, setCookies } from './auth-fixtures';

describe('POST /api/v1/auth/refresh (integração)', () => {
  let user: { id: string; email: string };
  let cookie: string;

  beforeEach(async () => {
    user = await createAuthUser();
    cookie = refreshCookie(await login(user.email));
  });

  const expectRejected = async (response: Awaited<ReturnType<typeof refresh>>) => {
    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
    expect(setCookies(response).slice(-1)[0]).toContain('Expires=Thu, 01 Jan 1970');
  };

  it('should return a new access token and rotate the refresh token', async () => {
    const response = await refresh(cookie);

    expect(response.status).toBe(200);
    expect(Object.keys(response.body)).toEqual(['accessToken']);
    expect(verifyAccessToken(response.body.accessToken)?.id).toBe(user.id);
    expect(refreshCookie(response)).not.toBe(cookie);
    expect((await refresh(refreshCookie(response))).status).toBe(200);
  });

  it('should reject a refresh token that was already used', async () => {
    await refresh(cookie);

    await expectRejected(await refresh(cookie));
  });

  it('should accept only one of two concurrent refreshes with the same token', async () => {
    const responses = await Promise.all([refresh(cookie), refresh(cookie)]);

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 401]);
  });

  it('should reject a request without cookie', async () => {
    await expectRejected(await refresh());
  });

  it('should reject a valid token without session', async () => {
    const { refreshToken } = generateTokens({ id: user.id, name: 'Ana Souza', nickname: 'ana' });

    await expectRejected(await refresh(`refreshToken=${refreshToken}`));
  });

  it('should reject a deactivated user', async () => {
    await AppDataSource.getRepository(UserEntity).update(user.id, {
      status: UserStatus.DEACTIVATED,
    });

    await expectRejected(await refresh(cookie));
  });
});
