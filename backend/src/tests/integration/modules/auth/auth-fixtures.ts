import supertest, { Response } from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { REFRESH_TOKEN_COOKIE } from '@/modules/auth/token/refresh-token.cookie';
import { hash } from '@/shared/utils/hash';

export const PASSWORD = '@Password123';

export const createAuthUser = async (nickname = 'ana') => {
  const id = uuidv7();
  const email = `${nickname}@example.com`;

  await AppDataSource.getRepository(UserEntity).insert({
    id,
    name: 'Ana Souza',
    nickname,
    email,
    password: await hash.generate(PASSWORD),
  });

  return { id, email };
};

export const login = (email: string, password = PASSWORD) =>
  supertest(app).post('/api/v1/auth/login').send({ email, password });

export const refresh = (cookie?: string) => {
  const request = supertest(app).post('/api/v1/auth/refresh');

  return cookie ? request.set('Cookie', cookie) : request;
};

export const logout = (cookie?: string) => {
  const request = supertest(app).post('/api/v1/auth/logout');

  return cookie ? request.set('Cookie', cookie) : request;
};

export const setCookies = (response: Response): string[] => {
  const header = response.headers['set-cookie'] as unknown as string[] | undefined;

  return (header ?? []).filter((cookie) => cookie.startsWith(`${REFRESH_TOKEN_COOKIE}=`));
};

export const refreshCookie = (response: Response): string => {
  const cookie = setCookies(response).slice(-1)[0] ?? '';

  return cookie.split(';')[0];
};
