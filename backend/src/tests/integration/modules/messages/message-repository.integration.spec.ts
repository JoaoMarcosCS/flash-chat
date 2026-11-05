import { beforeEach, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { MessageRepository } from '@/modules/messages/repository/message.repository';
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
          createdAt: expect.any(Date),
          sender: { id: bruno.id, name: 'Bruno Lima' },
        },
        {
          id: first,
          content: 'Primeira',
          createdAt: expect.any(Date),
          sender: { id: ana.id, name: 'Ana Souza' },
        },
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
});
