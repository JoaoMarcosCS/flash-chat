import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { RoutingKey } from '@/shared/enums/queue/queue.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { login, PASSWORD, refresh, refreshCookie, setCookies } from '../auth/auth-fixtures';
import { bearer, createUser, listenEvents, TestUser } from '../chats/chat-fixtures';
import { createMeUser, deleteMe, MeUser } from './user-fixtures';

const findStatus = async (id: string) =>
  (await AppDataSource.getRepository(UserEntity).findOneByOrFail({ id })).status;

describe('DELETE /api/v1/users/me (integração)', () => {
  let ana: MeUser;
  let bruno: TestUser;

  beforeEach(async () => {
    ana = await createMeUser();
    bruno = await createUser('Bruno Lima', 'bruno');
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).delete('/api/v1/users/me').send({});

    expect(response.status).toBe(401);
  });

  it('should deactivate the user and clear the refresh token cookie', async () => {
    const response = await deleteMe(ana, { currentPassword: PASSWORD });

    expect(response.status).toBe(204);
    expect(await findStatus(ana.id)).toBe(UserStatus.DEACTIVATED);
    expect(setCookies(response).slice(-1)[0]).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('should block login and refresh after the deactivation', async () => {
    const cookie = refreshCookie(await login(ana.email));

    await deleteMe(ana, { currentPassword: PASSWORD });

    expect((await login(ana.email)).status).toBe(401);
    expect((await refresh(cookie)).status).toBe(401);
  });

  it('should make the direct chat read-only for the other participant', async () => {
    const created = await supertest(app)
      .post('/api/v1/chats/direct')
      .set('Authorization', bearer(bruno))
      .send({ participantId: ana.id });

    await deleteMe(ana, { currentPassword: PASSWORD });

    const response = await supertest(app)
      .get(`/api/v1/chats/${created.body.id}`)
      .set('Authorization', bearer(bruno));
    expect(response.body.readOnly).toBe(true);
  });

  it('should publish user.deactivated to the participants of the chats of the user', async () => {
    const carla = await createUser('Carla Dias', 'carla');
    await supertest(app)
      .post('/api/v1/chats/groups')
      .set('Authorization', bearer(bruno))
      .send({ title: 'Viagem', participantIds: [ana.id, carla.id] });
    const listener = await listenEvents(RoutingKey.USER_DEACTIVATED);

    await deleteMe(ana, { currentPassword: PASSWORD });

    const [event] = (await listener.received()) as {
      participantIds: string[];
      user: { id: string };
    }[];
    expect(event.user).toEqual({ id: ana.id });
    expect(event.participantIds.sort()).toEqual([bruno.id, carla.id].sort());
    await listener.close();
  });

  it('should keep the e-mail and the nickname taken after the deactivation', async () => {
    await deleteMe(ana, { currentPassword: PASSWORD });

    const response = await supertest(app).post('/api/v1/users').send({
      name: 'Ana Lima',
      nickname: 'ana',
      email: 'other@example.com',
      password: PASSWORD,
    });

    expect(response.status).toBe(409);
  });

  it('should return 400 when the current password is missing or wrong', async () => {
    const missing = await deleteMe(ana, {});
    const wrong = await deleteMe(ana, { currentPassword: '@Wrong123' });

    expect(missing.status).toBe(400);
    expect(missing.body.error.message).toBe('Senha atual é obrigatória');
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.message).toBe('Senha atual incorreta');
    expect(await findStatus(ana.id)).toBe(UserStatus.ACTIVE);
  });

  it('should return 401 when the user is already deactivated', async () => {
    await deleteMe(ana, { currentPassword: PASSWORD });

    const response = await deleteMe(ana, { currentPassword: PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
  });
});
