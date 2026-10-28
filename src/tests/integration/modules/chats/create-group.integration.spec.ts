import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { ChatParticipantEntity } from '@/modules/chats/entity/chat-participant.entity';
import { bearer, createUser, deactivate, TestUser } from './chat-fixtures';

const post = (user: TestUser, body: object) =>
  supertest(app).post('/api/v1/chats/groups').set('Authorization', bearer(user)).send(body);

describe('POST /api/v1/chats/groups (integração)', () => {
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;

  beforeEach(async () => {
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
    carla = await createUser('Carla Dias', 'carla');
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).post('/api/v1/chats/groups').send({});

    expect(response.status).toBe(401);
  });

  it('should create a group with the initiator and return 201', async () => {
    const response = await post(ana, {
      title: '  Viagem   de férias ✈️ ',
      participantIds: [carla.id, bruno.id],
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      isGroup: true,
      title: 'Viagem de férias ✈️',
      createdBy: ana.id,
      readOnly: false,
    });
    expect(response.body.participants.map((participant: TestUser) => participant.id)).toEqual([
      ana.id,
      bruno.id,
      carla.id,
    ]);
    expect(
      await AppDataSource.getRepository(ChatParticipantEntity).countBy({
        chatId: response.body.id,
      }),
    ).toBe(3);
  });

  it.each([
    [{ participantIds: [] }, 'Título é obrigatório'],
    [{ title: 'Viagem\nférias' }, 'Título não pode conter quebras de linha ou tabulações'],
    [{ title: 'a'.repeat(101) }, 'Título deve ter no máximo 100 caracteres'],
  ])('should return 400 for title in %j', async (override, message) => {
    const response = await post(ana, {
      title: undefined,
      participantIds: [bruno.id, carla.id],
      ...override,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
  });

  it('should return 400 with fewer than 2 participant ids', async () => {
    const response = await post(ana, { title: 'Viagem', participantIds: [bruno.id] });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Group deve ter de 3 a 50 Participants');
  });

  it('should return 400 with repeated participant ids', async () => {
    const response = await post(ana, { title: 'Viagem', participantIds: [bruno.id, bruno.id] });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Participants repetidos');
  });

  it('should return 400 when the user is among the participants', async () => {
    const response = await post(ana, { title: 'Viagem', participantIds: [bruno.id, ana.id] });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Não é possível incluir a si mesmo');
  });

  it('should return 404 when a participant does not exist', async () => {
    const response = await post(ana, { title: 'Viagem', participantIds: [bruno.id, uuidv7()] });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Usuário não encontrado');
  });

  it('should return 404 when a participant is deactivated', async () => {
    await deactivate(carla);

    const response = await post(ana, { title: 'Viagem', participantIds: [bruno.id, carla.id] });

    expect(response.status).toBe(404);
    expect(await AppDataSource.getRepository(ChatEntity).count()).toBe(0);
  });

  it('should return 401 when the initiator is deactivated', async () => {
    await deactivate(ana);

    const response = await post(ana, { title: 'Viagem', participantIds: [bruno.id, carla.id] });

    expect(response.status).toBe(401);
  });
});
