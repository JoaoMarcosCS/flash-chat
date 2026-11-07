import { beforeEach, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { MessageRepository } from '@/modules/messages/repository/message.repository';
import { ContentStatus } from '@/shared/enums/messages/content-status.enum';
import { createUser, TestUser } from '../chats/chat-fixtures';

describe('MessageRepository (integração)', () => {
  let repository: MessageRepository;
  let ana: TestUser;
  let bruno: TestUser;
  let chatId: string;

  const persist = (content: string, sender = ana, id = uuidv7()) =>
    repository
      .persist({ id, chatId, senderId: sender.id, content, createdAt: new Date() })
      .then(() => id);

  const findChat = () => AppDataSource.getRepository(ChatEntity).findOneByOrFail({ id: chatId });

  beforeEach(async () => {
    repository = new MessageRepository();
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
    const chat = await new ChatRepository().createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    chatId = chat.id;
  });

  describe('persist', () => {
    it('should insert the message and update the last message', async () => {
      const id = await persist('Oi, tudo bem?');

      expect(await AppDataSource.getRepository(MessageEntity).findOneBy({ id })).toMatchObject({
        chatId,
        senderId: ana.id,
        content: 'Oi, tudo bem?',
      });
      expect(await findChat()).toMatchObject({
        lastMessageId: id,
        lastMessageContent: 'Oi, tudo bem?',
      });
    });

    it('should ignore a redelivered message', async () => {
      const id = await persist('Oi');

      await persist('Oi', ana, id);

      expect(await AppDataSource.getRepository(MessageEntity).countBy({ id })).toBe(1);
    });

    it('should not move the last message back to an older message', async () => {
      const olderId = uuidv7();
      const newerId = await persist('Mais nova');

      await persist('Mais antiga', bruno, olderId);

      expect(await findChat()).toMatchObject({
        lastMessageId: newerId,
        lastMessageContent: 'Mais nova',
      });
    });

    it('should truncate the last message content to 100 characters', async () => {
      const content = `${'😀'.repeat(99)}ab`;

      await persist(content);

      expect((await findChat()).lastMessageContent).toBe(`${'😀'.repeat(99)}a`);
    });
  });

  describe('findByChat', () => {
    it('should return the messages from the newest to the oldest with the sender', async () => {
      const first = await persist('Primeira');
      const second = await persist('Segunda', bruno);

      expect(await repository.findByChat({ chatId, limit: 20 })).toEqual([
        {
          id: second,
          content: 'Segunda',
          contentStatus: ContentStatus.ORIGINAL,
          createdAt: expect.any(Date),
          editedAt: null,
          deletedAt: null,
          sender: { id: bruno.id, name: 'Bruno Lima' },
        },
        {
          id: first,
          content: 'Primeira',
          contentStatus: ContentStatus.ORIGINAL,
          createdAt: expect.any(Date),
          editedAt: null,
          deletedAt: null,
          sender: { id: ana.id, name: 'Ana Souza' },
        },
      ]);
    });

    it('should return edited and deleted messages with their content status', async () => {
      const edited = await persist('Oi');
      const deleted = await persist('Tchau');
      const editedAt = new Date();
      const deletedAt = new Date();
      await repository.edit({ id: edited, chatId, content: 'Olá', editedAt });
      await repository.delete({ id: deleted, chatId, deletedAt });

      expect(await repository.findByChat({ chatId, limit: 20 })).toMatchObject([
        { id: deleted, content: null, contentStatus: ContentStatus.DELETED, deletedAt },
        { id: edited, content: 'Olá', contentStatus: ContentStatus.EDITED, editedAt },
      ]);
    });

    it('should paginate by cursor and limit', async () => {
      const first = await persist('1');
      const second = await persist('2');
      const third = await persist('3');

      const page = await repository.findByChat({ chatId, cursor: third, limit: 1 });

      expect(page.map(({ id }) => id)).toEqual([second]);
      expect(
        (await repository.findByChat({ chatId, cursor: second, limit: 20 })).map(({ id }) => id),
      ).toEqual([first]);
    });

    it('should not return messages from other chats', async () => {
      const carla = await createUser('Carla Dias', 'carla');
      const chat = await new ChatRepository().createDirectChat({
        initiatorId: ana.id,
        participantId: carla.id,
      });
      await repository.persist({
        id: uuidv7(),
        chatId: chat.id,
        senderId: ana.id,
        content: 'Outro chat',
        createdAt: new Date(),
      });

      expect(await repository.findByChat({ chatId, limit: 20 })).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return the message of the chat', async () => {
      const id = await persist('Oi');

      expect(await repository.findById(id, chatId)).toEqual({
        id,
        chatId,
        senderId: ana.id,
        content: 'Oi',
        contentStatus: ContentStatus.ORIGINAL,
        editedAt: null,
      });
    });

    it('should return null for a message of another chat or a missing message', async () => {
      const id = await persist('Oi');

      expect(await repository.findById(id, uuidv7())).toBeNull();
      expect(await repository.findById(uuidv7(), chatId)).toBeNull();
    });
  });

  describe('edit', () => {
    it('should update the content, the content status and the last message content', async () => {
      const id = await persist('Oi');
      const editedAt = new Date();

      expect(await repository.edit({ id, chatId, content: 'Olá', editedAt })).toBe(true);

      expect(await AppDataSource.getRepository(MessageEntity).findOneBy({ id })).toMatchObject({
        content: 'Olá',
        contentStatus: ContentStatus.EDITED,
        editedAt,
        deletedAt: null,
      });
      expect(await findChat()).toMatchObject({ lastMessageId: id, lastMessageContent: 'Olá' });
    });

    it('should not change the last message content when the message is not the last one', async () => {
      const id = await persist('Oi');
      await persist('Mais nova');

      await repository.edit({ id, chatId, content: 'Olá', editedAt: new Date() });

      expect((await findChat()).lastMessageContent).toBe('Mais nova');
    });

    it('should truncate the last message content to 100 characters', async () => {
      const id = await persist('Oi');

      await repository.edit({ id, chatId, content: 'a'.repeat(101), editedAt: new Date() });

      expect((await findChat()).lastMessageContent).toBe('a'.repeat(100));
    });

    it('should not edit a deleted message', async () => {
      const id = await persist('Oi');
      await repository.delete({ id, chatId, deletedAt: new Date() });

      expect(await repository.edit({ id, chatId, content: 'Olá', editedAt: new Date() })).toBe(
        false,
      );
      expect(await AppDataSource.getRepository(MessageEntity).findOneBy({ id })).toMatchObject({
        content: null,
        contentStatus: ContentStatus.DELETED,
        editedAt: null,
      });
    });
  });

  describe('delete', () => {
    it('should clear the content, keep the chat position and clear the last message content', async () => {
      const id = await persist('Oi');
      const deletedAt = new Date();

      expect(await repository.delete({ id, chatId, deletedAt })).toBe(true);

      expect(await AppDataSource.getRepository(MessageEntity).findOneBy({ id })).toMatchObject({
        content: null,
        contentStatus: ContentStatus.DELETED,
        deletedAt,
      });
      expect(await findChat()).toMatchObject({ lastMessageId: id, lastMessageContent: null });
    });

    it('should not change the last message content when the message is not the last one', async () => {
      const id = await persist('Oi');
      await persist('Mais nova');

      await repository.delete({ id, chatId, deletedAt: new Date() });

      expect((await findChat()).lastMessageContent).toBe('Mais nova');
    });

    it('should not delete a message twice', async () => {
      const id = await persist('Oi');
      const deletedAt = new Date('2026-10-27T12:00:00Z');
      await repository.delete({ id, chatId, deletedAt });

      expect(await repository.delete({ id, chatId, deletedAt: new Date() })).toBe(false);
      expect(
        (await AppDataSource.getRepository(MessageEntity).findOneByOrFail({ id })).deletedAt,
      ).toEqual(deletedAt);
    });

    it('should not be overwritten by a redelivered persist', async () => {
      const id = await persist('Oi');
      await repository.delete({ id, chatId, deletedAt: new Date() });

      await persist('Oi', ana, id);

      expect(await AppDataSource.getRepository(MessageEntity).findOneBy({ id })).toMatchObject({
        content: null,
        contentStatus: ContentStatus.DELETED,
      });
      expect((await findChat()).lastMessageContent).toBeNull();
    });
  });

  describe('constraints', () => {
    it.each([
      ['a deleted message with content', { content: 'Oi', contentStatus: ContentStatus.DELETED }],
      ['an original message without content', { content: null }],
      ['an empty content', { content: '' }],
    ])('should reject %s', async (_, values) => {
      const insert = AppDataSource.getRepository(MessageEntity).insert({
        id: uuidv7(),
        chatId,
        senderId: ana.id,
        createdAt: new Date(),
        content: 'Oi',
        ...values,
      });

      await expect(insert).rejects.toThrow(/CK_messages/);
    });
  });
});
