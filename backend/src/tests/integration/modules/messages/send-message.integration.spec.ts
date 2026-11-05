import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { RoutingKey } from '@/shared/enums/queue/queue.enum';
import { bearer, createUser, deactivate, listenEvents, TestUser } from '../chats/chat-fixtures';

const post = (user: TestUser, chatId: string, body: object) =>
  supertest(app)
    .post(`/api/v1/chats/${chatId}/messages`)
    .set('Authorization', bearer(user))
    .send(body);

describe('POST /api/v1/chats/:id/messages (integração)', () => {
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
    const response = await supertest(app)
      .post(`/api/v1/chats/${chatId}/messages`)
      .send({ content: 'Oi' });

    expect(response.status).toBe(401);
  });

  it('should publish message.published and return 201 without writing to the database', async () => {
    const listener = await listenEvents(RoutingKey.MESSAGE_PUBLISHED);

    const response = await post(ana, chatId, { content: '  Oi, tudo bem?  ' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: expect.any(String), createdAt: expect.any(String) });
    expect(await listener.received()).toEqual([
      {
        participantIds: [ana.id, bruno.id],
        message: {
          id: response.body.id,
          chatId,
          content: 'Oi, tudo bem?',
          createdAt: response.body.createdAt,
          sender: { id: ana.id, name: 'Ana Souza' },
        },
      },
    ]);
    expect(await AppDataSource.getRepository(MessageEntity).count()).toBe(0);
    await listener.close();
  });

  it('should return 403 when the direct chat is read-only', async () => {
    await deactivate(bruno);

    const response = await post(ana, chatId, { content: 'Oi' });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Chat somente leitura');
  });

  it('should return 401 when the sender is deactivated', async () => {
    const { id: groupId } = await new ChatRepository().createGroup({
      initiatorId: ana.id,
      title: 'Viagem',
      participantIds: [bruno.id, carla.id],
    });
    await deactivate(ana);

    const response = await post(ana, groupId, { content: 'Oi' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
  });

  it.each([
    ['a non participant', () => post(carla, chatId, { content: 'Oi' })],
    ['a missing chat', () => post(ana, uuidv7(), { content: 'Oi' })],
  ])('should return 404 for %s', async (_, request) => {
    const response = await request();

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Chat não encontrado');
  });

  it.each([
    ['invalid', { content: 'Oi' }, 'Chat inválido'],
    [undefined, {}, 'Mensagem é obrigatória'],
    [undefined, { content: '   ' }, 'Mensagem é obrigatória'],
    [undefined, { content: 'a'.repeat(1001) }, 'Mensagem deve ter no máximo 1000 caracteres'],
  ])('should return 400 for chat %s and body %j', async (id, body, message) => {
    const response = await post(ana, id ?? chatId, body);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
  });
});
