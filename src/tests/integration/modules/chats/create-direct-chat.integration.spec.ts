import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { bearer, createUser, deactivate, listenChatCreated, TestUser } from './chat-fixtures';

const post = (user: TestUser, body: object) =>
  supertest(app).post('/api/v1/chats/direct').set('Authorization', bearer(user)).send(body);

describe('POST /api/v1/chats/direct (integração)', () => {
  let ana: TestUser;
  let bruno: TestUser;

  beforeEach(async () => {
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).post('/api/v1/chats/direct').send({});

    expect(response.status).toBe(401);
  });

  it('should create a direct chat and return 201', async () => {
    const response = await post(ana, { participantId: bruno.id });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      isGroup: false,
      title: null,
      createdBy: ana.id,
      createdAt: expect.any(String),
      readOnly: false,
      participants: [
        { id: ana.id, name: 'Ana Souza', nickname: 'ana' },
        { id: bruno.id, name: 'Bruno Lima', nickname: 'bruno' },
      ],
    });
  });

  it('should publish chat.created only when the chat is created', async () => {
    const listener = await listenChatCreated();

    const created = await post(ana, { participantId: bruno.id });
    await post(bruno, { participantId: ana.id });

    expect(await listener.received()).toEqual([
      { participantIds: [ana.id, bruno.id], chat: created.body },
    ]);
    await listener.close();
  });

  it('should return 200 with the same chat when it already exists', async () => {
    const first = await post(ana, { participantId: bruno.id });
    const second = await post(bruno, { participantId: ana.id.toUpperCase() });

    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(await AppDataSource.getRepository(ChatEntity).count()).toBe(1);
  });

  it.each([
    [{}, 'Participant inválido'],
    [{ participantId: 'invalid' }, 'Participant inválido'],
  ])('should return 400 for body %j', async (body, message) => {
    const response = await post(ana, body);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
  });

  it('should return 400 when the participant is the user', async () => {
    const response = await post(ana, { participantId: ana.id });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Não é possível incluir a si mesmo');
  });

  it('should return 404 when the participant does not exist', async () => {
    const response = await post(ana, { participantId: uuidv7() });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Usuário não encontrado');
  });

  it('should return 404 for a deactivated participant without a direct chat', async () => {
    const carla = await createUser('Carla Dias', 'carla', UserStatus.DEACTIVATED);

    const response = await post(ana, { participantId: carla.id });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Usuário não encontrado');
    expect(await AppDataSource.getRepository(ChatEntity).count()).toBe(0);
  });

  it('should return 200 read-only for a deactivated participant with a direct chat', async () => {
    const created = await post(ana, { participantId: bruno.id });
    await deactivate(bruno);

    const response = await post(ana, { participantId: bruno.id });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
    expect(response.body.readOnly).toBe(true);
  });

  it('should return 401 when the initiator is deactivated', async () => {
    await deactivate(ana);

    const response = await post(ana, { participantId: bruno.id });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
  });
});
