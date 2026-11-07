import supertest from 'supertest';
import { app } from '@/infra/http/index';
import { generateTokens } from '@/modules/auth/token/token';
import { createAuthUser } from '../auth/auth-fixtures';

export type MeUser = { id: string; email: string; token: string };

export const createMeUser = async (nickname = 'ana'): Promise<MeUser> => {
  const { id, email } = await createAuthUser(nickname);

  return { id, email, token: generateTokens({ id, name: 'Ana Souza', nickname }).accessToken };
};

export const getMe = (user: MeUser) =>
  supertest(app).get('/api/v1/users/me').set('Authorization', `Bearer ${user.token}`);

export const patchMe = (user: MeUser, body: object) =>
  supertest(app).patch('/api/v1/users/me').set('Authorization', `Bearer ${user.token}`).send(body);

export const deleteMe = (user: MeUser, body: object) =>
  supertest(app).delete('/api/v1/users/me').set('Authorization', `Bearer ${user.token}`).send(body);
