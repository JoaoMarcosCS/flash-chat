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
  sendMessage,
  TestUser,
} from '../chats/chat-fixtures';

describe('DELETE /api/v1/chats/:chatId/messages/:id (integração)', () => {
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
    const response = await supertest(app).delete(`/api/v1/chats/${chatId}/messages/${messageId}`);

    expect(response.status).toBe(401);
  });

  it('should delete the message, keep the chat position and publish message.deleted', async () => {
    const listener = await listenEvents(RoutingKey.MESSAGE_DELETED);

    const response = await deleteMessage(ana, chatId, messageId);

    expect(response.status).toBe(204);
    const message = await findMessage();
    expect(message).toMatchObject({
      content: null,
      contentStatus: ContentStatus.DELETED,
      deletedAt: expect.any(Date),
    });
    expect(await findChat()).toMatchObject({ lastMessageId: messageId, lastMessageContent: null });
    expect(await listener.received()).toEqual([
      {
        participantIds: [ana.id, bruno.id],
        message: { id: messageId, chatId, deletedAt: message.deletedAt?.toISOString() },
      },
    ]);
    await listener.close();
  });

  it('should not change the last message when deleting an older message', async () => {
    await sendMessage(chatId, bruno, 'Mais nova');

    await deleteMessage(ana, chatId, messageId);

    expect((await findChat()).lastMessageContent).toBe('Mais nova');
  });

  it('should return 409 for a message already deleted', async () => {
    await deleteMessage(ana, chatId, messageId);

    const response = await deleteMessage(ana, chatId, messageId);

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe('Mensagem apagada');
  });

  it('should return 403 when the user is not the sender', async () => {
    const response = await deleteMessage(bruno, chatId, messageId);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Somente quem enviou a mensagem pode alterá-la');
    expect((await findMessage()).contentStatus).toBe(ContentStatus.ORIGINAL);
  });

  it('should return 403 when the direct chat is read-only', async () => {
    await deactivate(bruno);

    const response = await deleteMessage(ana, chatId, messageId);

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

    const response = await deleteMessage(ana, groupId, groupMessageId);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Token inválido');
  });

  it.each([
    ['a non participant', () => deleteMessage(carla, chatId, messageId)],
    ['a missing chat', () => deleteMessage(ana, uuidv7(), messageId)],
  ])('should return 404 for %s', async (_, request) => {
    const response = await request();

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Chat não encontrado');
  });

  it('should return 404 for a message that is not persisted', async () => {
    const response = await deleteMessage(ana, chatId, uuidv7());

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Mensagem não encontrada');
  });

  it.each([
    [{ chatId: 'invalid' }, 'Chat inválido'],
    [{ id: 'invalid' }, 'Mensagem inválida'],
  ])('should return 400 for params %j', async (params, message) => {
    const ids = { chatId, id: messageId, ...params };

    const response = await deleteMessage(ana, ids.chatId, ids.id);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(message);
  });
});
