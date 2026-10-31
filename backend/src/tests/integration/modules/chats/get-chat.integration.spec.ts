import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { app } from '@/infra/http/index';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { bearer, createUser, deactivate, TestUser } from './chat-fixtures';

const get = (user: TestUser, id: string) =>
  supertest(app).get(`/api/v1/chats/${id}`).set('Authorization', bearer(user));

describe('GET /api/v1/chats/:id (integração)', () => {
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;
  let chatId: string;

  beforeEach(async () => {
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
    carla = await createUser('Carla Dias', 'carla');
    const { chat } = await new ChatRepository().createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    chatId = chat.id;
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).get(`/api/v1/chats/${chatId}`);

    expect(response.status).toBe(401);
  });

  it('should return the chat to a participant', async () => {
    const response = await get(bruno, chatId);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: chatId, isGroup: false, readOnly: false });
    expect(response.body.participants).toEqual([
      { id: ana.id, name: 'Ana Souza', nickname: 'ana' },
      { id: bruno.id, name: 'Bruno Lima', nickname: 'bruno' },
    ]);
  });

  it('should return read-only when the other participant is deactivated', async () => {
    await deactivate(bruno);

    const response = await get(ana, chatId);

    expect(response.status).toBe(200);
    expect(response.body.readOnly).toBe(true);
  });

  it.each([
    ['a non participant', () => get(carla, chatId)],
    ['a missing chat', () => get(ana, uuidv7())],
  ])('should return 404 for %s', async (_, request) => {
    const response = await request();

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Chat não encontrado');
  });

  it('should return 400 when the id is not an uuid', async () => {
    const response = await get(ana, 'invalid');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Chat inválido');
  });
});
