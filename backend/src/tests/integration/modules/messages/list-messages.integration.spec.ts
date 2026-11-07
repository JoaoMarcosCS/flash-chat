import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { app } from '@/infra/http/index';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import {
  bearer,
  createUser,
  deactivate,
  deleteMessage,
  patchMessage,
  sendMessage,
  TestUser,
} from '../chats/chat-fixtures';

const get = (user: TestUser, chatId: string, query: object = {}) =>
  supertest(app)
    .get(`/api/v1/chats/${chatId}/messages`)
    .query(query)
    .set('Authorization', bearer(user));

describe('GET /api/v1/chats/:id/messages (integração)', () => {
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;
  let chatId: string;

  beforeEach(async () => {
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
    carla = await createUser('Carla Dias', 'carla');
    const chat = await new ChatRepository().createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    chatId = chat.id;
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app).get(`/api/v1/chats/${chatId}/messages`);

    expect(response.status).toBe(401);
  });

  it('should return the messages from the newest to the oldest', async () => {
    const first = await sendMessage(chatId, ana, 'Oi');
    const second = await sendMessage(chatId, bruno, 'Olá');

    const response = await get(bruno, chatId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          id: second,
          content: 'Olá',
          contentStatus: 'original',
          createdAt: expect.any(String),
          editedAt: null,
          deletedAt: null,
          sender: { id: bruno.id, name: 'Bruno Lima' },
        },
        {
          id: first,
          content: 'Oi',
          contentStatus: 'original',
          createdAt: expect.any(String),
          editedAt: null,
          deletedAt: null,
          sender: { id: ana.id, name: 'Ana Souza' },
        },
      ],
      nextCursor: null,
    });
  });

  it('should return edited and deleted messages', async () => {
    const edited = await sendMessage(chatId, ana, 'Oi');
    const deleted = await sendMessage(chatId, ana, 'Tchau');
    await patchMessage(ana, chatId, edited, { content: 'Olá' });
    await deleteMessage(ana, chatId, deleted);

    const response = await get(bruno, chatId);

    expect(response.body.data).toMatchObject([
      { id: deleted, content: null, contentStatus: 'deleted', deletedAt: expect.any(String) },
      { id: edited, content: 'Olá', contentStatus: 'edited', editedAt: expect.any(String) },
    ]);
  });

  it('should paginate with limit and cursor', async () => {
    const first = await sendMessage(chatId, ana, '1');
    const second = await sendMessage(chatId, ana, '2');
    const third = await sendMessage(chatId, ana, '3');

    const page = await get(ana, chatId, { limit: 2 });
    const next = await get(ana, chatId, { limit: 2, cursor: page.body.nextCursor });

    expect(page.body.data.map(({ id }: { id: string }) => id)).toEqual([third, second]);
    expect(page.body.nextCursor).toBe(second);
    expect(next.body.data.map(({ id }: { id: string }) => id)).toEqual([first]);
    expect(next.body.nextCursor).toBeNull();
  });

  it('should list a read-only chat', async () => {
    await sendMessage(chatId, bruno, 'Tchau');
    await deactivate(bruno);

    const response = await get(ana, chatId);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it.each([
    ['a non participant', () => get(carla, chatId)],
    ['a missing chat', () => get(ana, uuidv7())],
  ])('should return 404 for %s', async (_, request) => {
    const response = await request();

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Chat não encontrado');
  });

  it.each([
    ['invalid', {}, 'Chat inválido'],
    [undefined, { cursor: 'invalid' }, 'Cursor inválido'],
    [undefined, { limit: 101 }, 'Limite deve ser no máximo 100'],
  ])('should return 400 for chat %s and query %j', async (id, query, message) => {
    const response = await get(ana, id ?? chatId, query);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
  });
});
