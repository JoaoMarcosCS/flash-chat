import { beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { app } from '@/infra/http/index';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { ContentStatus } from '@/shared/enums/messages/content-status.enum';
import { RoutingKey } from '@/shared/enums/queue/queue.enum';
import {
  createUser,
  deactivate,
  deleteMessage,
  listenEvents,
  patchMessage,
  sendMessage,
  TestUser,
} from '../chats/chat-fixtures';

describe('PATCH /api/v1/chats/:chatId/messages/:id (integração)', () => {
  let ana: TestUser;
  let bruno: TestUser;
  let carla: TestUser;
  let chatId: string;
  let messageId: string;

  const findMessage = () =>
    AppDataSource.getRepository(MessageEntity).findOneByOrFail({ id: messageId });

  const findChat = () => AppDataSource.getRepository(ChatEntity).findOneByOrFail({ id: chatId });

  beforeEach(async () => {
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
    carla = await createUser('Carla Dias', 'carla');
    const chat = await new ChatRepository().createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    chatId = chat.id;
    messageId = await sendMessage(chatId, ana, 'Oi');
  });

  it('should return 401 without token', async () => {
    const response = await supertest(app)
      .patch(`/api/v1/chats/${chatId}/messages/${messageId}`)
      .send({ content: 'Olá' });

    expect(response.status).toBe(401);
  });

  it('should edit the message, update the last message and publish message.edited', async () => {
    const listener = await listenEvents(RoutingKey.MESSAGE_EDITED);

    const response = await patchMessage(ana, chatId, messageId, { content: '  Olá  ' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: messageId,
      chatId,
      content: 'Olá',
      contentStatus: 'edited',
      editedAt: expect.any(String),
    });
    expect(await findMessage()).toMatchObject({
      content: 'Olá',
      contentStatus: ContentStatus.EDITED,
      editedAt: new Date(response.body.editedAt),
    });
    expect(await findChat()).toMatchObject({ lastMessageId: messageId, lastMessageContent: 'Olá' });
    expect(await listener.received()).toEqual([
      {
        participantIds: [ana.id, bruno.id],
        message: { id: messageId, chatId, content: 'Olá', editedAt: response.body.editedAt },
      },
    ]);
    await listener.close();
  });

  it('should not change the last message when editing an older message', async () => {
    await sendMessage(chatId, bruno, 'Mais nova');

    await patchMessage(ana, chatId, messageId, { content: 'Olá' });

    expect((await findChat()).lastMessageContent).toBe('Mais nova');
  });

  it('should accept the same content without changing the message or publishing', async () => {
    const listener = await listenEvents(RoutingKey.MESSAGE_EDITED);

    const response = await patchMessage(ana, chatId, messageId, { content: 'Oi' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ contentStatus: 'original', editedAt: null });
    expect(await findMessage()).toMatchObject({ contentStatus: ContentStatus.ORIGINAL });
    expect(await listener.received()).toEqual([]);
    await listener.close();
  });

  it('should return 409 for a deleted message', async () => {
    await deleteMessage(ana, chatId, messageId);

    const response = await patchMessage(ana, chatId, messageId, { content: 'Olá' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Mensagem apagada');
  });

  it('should return 403 when the user is not the sender', async () => {
    const response = await patchMessage(bruno, chatId, messageId, { content: 'Olá' });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Somente quem enviou a mensagem pode alterá-la');
    expect((await findMessage()).content).toBe('Oi');
  });

  it('should return 403 when the direct chat is read-only', async () => {
    await deactivate(bruno);

    const response = await patchMessage(ana, chatId, messageId, { content: 'Olá' });

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Chat somente leitura');
  });

  it('should return 401 when the sender is deactivated', async () => {
    const { id: groupId } = await new ChatRepository().createGroup({
      initiatorId: ana.id,
      title: 'Viagem',
      participantIds: [bruno.id, carla.id],
    });
    const groupMessageId = await sendMessage(groupId, ana, 'Oi');
    await deactivate(ana);

    const response = await patchMessage(ana, groupId, groupMessageId, { content: 'Olá' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
  });

  it.each([
    ['a non participant', () => patchMessage(carla, chatId, messageId, { content: 'Olá' })],
    ['a missing chat', () => patchMessage(ana, uuidv7(), messageId, { content: 'Olá' })],
  ])('should return 404 for %s', async (_, request) => {
    const response = await request();

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Chat não encontrado');
  });

  it('should return 404 for a message that is not persisted', async () => {
    const response = await patchMessage(ana, chatId, uuidv7(), { content: 'Olá' });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Mensagem não encontrada');
  });

  it.each([
    [{ chatId: 'invalid' }, { content: 'Olá' }, 'Chat inválido'],
    [{ id: 'invalid' }, { content: 'Olá' }, 'Mensagem inválida'],
    [{}, {}, 'Mensagem é obrigatória'],
    [{}, { content: '   ' }, 'Mensagem é obrigatória'],
    [{}, { content: 'a'.repeat(1001) }, 'Mensagem deve ter no máximo 1000 caracteres'],
  ])('should return 400 for params %j and body %j', async (params, body, message) => {
    const ids = { chatId, id: messageId, ...params };

    const response = await patchMessage(ana, ids.chatId, ids.id, body);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
  });
});
