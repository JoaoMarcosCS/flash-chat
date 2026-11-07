import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { hash } from '@/shared/utils/hash';
import { login, PASSWORD, refresh, refreshCookie } from '../auth/auth-fixtures';
import { createMeUser, MeUser, patchMe } from './user-fixtures';

const findUser = (id: string) =>
  AppDataSource.getRepository(UserEntity)
    .createQueryBuilder('u')
    .addSelect('u.password')
    .where('u.id = :id', { id })
    .getOneOrFail();

describe('PATCH /api/v1/users/me (integração)', () => {
  let ana: MeUser;

  beforeEach(async () => {
    ana = await createMeUser();
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).patch('/api/v1/users/me').send({});

    expect(response.status).toBe(401);
  });

  it('should update name, nickname and e-mail and return the profile', async () => {
    const response = await patchMe(ana, {
      name: '  Ana   Lima ',
      nickname: 'ana.lima',
      email: 'ana.lima@example.com',
      currentPassword: PASSWORD,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: ana.id,
      name: 'Ana Lima',
      nickname: 'ana.lima',
      email: 'ana.lima@example.com',
    });
    expect(await findUser(ana.id)).toMatchObject({
      name: 'Ana Lima',
      nickname: 'ana.lima',
      email: 'ana.lima@example.com',
    });
  });

  it('should keep the nickname and e-mail of the user itself available', async () => {
    const response = await patchMe(ana, {
      nickname: 'ANA',
      email: ana.email.toUpperCase(),
      currentPassword: PASSWORD,
    });

    expect(response.status).toBe(200);
  });

  it('should save the new password hashed and keep the open sessions', async () => {
    const cookie = refreshCookie(await login(ana.email));

    const response = await patchMe(ana, { password: '@NewPass123', currentPassword: PASSWORD });

    const { password } = await findUser(ana.id);
    expect(response.status).toBe(200);
    expect(await hash.compare('@NewPass123', password)).toBe(true);
    expect((await login(ana.email, PASSWORD)).status).toBe(401);
    expect((await login(ana.email, '@NewPass123')).status).toBe(200);
    expect((await refresh(cookie)).status).toBe(200);
  });

  it('should return 400 when the current password is missing', async () => {
    const response = await patchMe(ana, { name: 'Ana Lima' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Senha atual é obrigatória');
  });

  it('should return 400 when the current password is wrong', async () => {
    const response = await patchMe(ana, { name: 'Ana Lima', currentPassword: '@Wrong123' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Senha atual incorreta');
    expect((await findUser(ana.id)).name).toBe('Ana Souza');
  });

  it('should return 400 without any field to edit', async () => {
    const response = await patchMe(ana, { currentPassword: PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Informe ao menos um campo para editar');
  });

  it('should return 400 for a field that breaks the sign up rules', async () => {
    const response = await patchMe(ana, { password: 'abc', currentPassword: PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Senha deve ter no mínimo 6 caracteres');
  });

  it('should return 409 when the nickname belongs to another user ignoring case', async () => {
    await createMeUser('bruno');

    const response = await patchMe(ana, { nickname: 'Bruno', currentPassword: PASSWORD });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Nickname já cadastrado');
  });

  it('should return 409 when the e-mail belongs to a deactivated user', async () => {
    const bruno = await createMeUser('bruno');
    await AppDataSource.getRepository(UserEntity).update(bruno.id, {
      status: UserStatus.DEACTIVATED,
    });

    const response = await patchMe(ana, { email: bruno.email, currentPassword: PASSWORD });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('E-mail já cadastrado');
  });

  it('should return 401 for a deactivated user with a valid token', async () => {
    await AppDataSource.getRepository(UserEntity).update(ana.id, {
      status: UserStatus.DEACTIVATED,
    });

    const response = await patchMe(ana, { name: 'Ana Lima', currentPassword: PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
  });
});
