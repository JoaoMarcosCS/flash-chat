import { describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

const createUser = (name: string, nickname: string) =>
  new UserRepository().create({
    name,
    nickname,
    email: `${nickname}@example.com`,
    password: 'hashed',
  });

const sendMessage = async (chatId: string, senderId: string, content: string) => {
  const id = uuidv7();

  await AppDataSource.getRepository(MessageEntity).insert({
    id,
    chatId,
    senderId,
    content,
    createdAt: new Date(),
  });
  await AppDataSource.getRepository(ChatEntity).update(chatId, {
    lastMessageId: id,
    lastMessageContent: content,
  });

  return id;
};

describe('ChatRepository (integração)', () => {
  it('should create a direct chat with sorted direct key and both participants', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');

    const { chat, created } = await repository.createDirectChat({
      initiatorId: bruno.id,
      participantId: ana.id,
    });

    const stored = await AppDataSource.getRepository(ChatEntity).findOneByOrFail({ id: chat.id });

    expect(created).toBe(true);
    expect(chat).toMatchObject({ isGroup: false, title: null, createdBy: bruno.id });
    expect(chat.createdAt).toBeInstanceOf(Date);
    expect(chat.participants.map((participant) => participant.id)).toEqual([ana.id, bruno.id]);
    expect(stored.directKey).toBe([ana.id, bruno.id].sort().join(':'));
  });

  it('should return the existing direct chat for the same pair in any order', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');

    const first = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    const second = await repository.createDirectChat({
      initiatorId: bruno.id,
      participantId: ana.id,
    });

    expect(second.created).toBe(false);
    expect(second.chat.id).toBe(first.chat.id);
    expect(await AppDataSource.getRepository(ChatEntity).count()).toBe(1);
  });

  it('should return a single direct chat on concurrent creation', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');

    const results = await Promise.all([
      repository.createDirectChat({ initiatorId: ana.id, participantId: bruno.id }),
      repository.createDirectChat({ initiatorId: bruno.id, participantId: ana.id }),
    ]);

    expect(new Set(results.map(({ chat }) => chat.id)).size).toBe(1);
    expect(results.filter(({ created }) => created)).toHaveLength(1);
    expect(await AppDataSource.getRepository(ChatEntity).count()).toBe(1);
  });

  it('should find a direct chat without creating one', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');

    expect(await repository.findDirectChat([ana.id, bruno.id])).toBeNull();

    const { chat } = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });

    expect((await repository.findDirectChat([bruno.id, ana.id]))?.id).toBe(chat.id);
  });

  it('should create a group with the initiator among the participants', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');
    const carla = await createUser('Carla Dias', 'carla');

    const group = await repository.createGroup({
      initiatorId: ana.id,
      title: 'Viagem',
      participantIds: [bruno.id, carla.id],
    });

    const stored = await AppDataSource.getRepository(ChatEntity).findOneByOrFail({ id: group.id });

    expect(group).toMatchObject({ isGroup: true, title: 'Viagem', createdBy: ana.id });
    expect(group.participants.map((participant) => participant.id)).toEqual([
      ana.id,
      bruno.id,
      carla.id,
    ]);
    expect(stored.directKey).toBeNull();
  });

  it('should not leave a chat behind when a participant insert fails', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');

    const promise = repository.createGroup({
      initiatorId: ana.id,
      title: 'Viagem',
      participantIds: [bruno.id, uuidv7()],
    });

    await expect(promise).rejects.toThrow();
    expect(await AppDataSource.getRepository(ChatEntity).count()).toBe(0);
  });

  it('should find a chat by id only for its participants', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');
    const carla = await createUser('Carla Dias', 'carla');
    const { chat } = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });

    expect((await repository.findById(chat.id, bruno.id))?.participants).toHaveLength(2);
    expect(await repository.findById(chat.id, carla.id)).toBeNull();
    expect(await repository.findById(uuidv7(), ana.id)).toBeNull();
  });

  it('should return participant status for deactivated users', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');
    const { chat } = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    await AppDataSource.getRepository(UserEntity).update(bruno.id, {
      status: UserStatus.DEACTIVATED,
    });

    const found = await repository.findById(chat.id, ana.id);

    expect(found?.participants.find((participant) => participant.id === bruno.id)?.status).toBe(
      UserStatus.DEACTIVATED,
    );
  });

  it('should list chats by last message or creation, most recent first', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');
    const carla = await createUser('Carla Dias', 'carla');
    const { chat: withBruno } = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    const group = await repository.createGroup({
      initiatorId: ana.id,
      title: 'Viagem',
      participantIds: [bruno.id, carla.id],
    });
    const messageId = await sendMessage(withBruno.id, bruno.id, 'Bora amanhã');

    const list = await repository.findByParticipant({ userId: ana.id, limit: 20 });

    expect(list).toEqual([
      {
        id: withBruno.id,
        isGroup: false,
        title: null,
        otherParticipant: { name: 'Bruno Lima', status: UserStatus.ACTIVE },
        lastMessage: {
          id: messageId,
          content: 'Bora amanhã',
          sender: { id: bruno.id, name: 'Bruno Lima' },
        },
      },
      {
        id: group.id,
        isGroup: true,
        title: 'Viagem',
        otherParticipant: null,
        lastMessage: null,
      },
    ]);
  });

  it('should list only chats of the participant', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');
    const carla = await createUser('Carla Dias', 'carla');
    await repository.createDirectChat({ initiatorId: ana.id, participantId: bruno.id });

    expect(await repository.findByParticipant({ userId: carla.id, limit: 20 })).toEqual([]);
  });

  it('should paginate the list by cursor', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');
    const carla = await createUser('Carla Dias', 'carla');
    const { chat: withBruno } = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    const { chat: withCarla } = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: carla.id,
    });

    const [first] = await repository.findByParticipant({ userId: ana.id, limit: 1 });
    const second = await repository.findByParticipant({
      userId: ana.id,
      cursor: first.id,
      limit: 20,
    });

    expect(first.id).toBe(withCarla.id);
    expect(second.map((chat) => chat.id)).toEqual([withBruno.id]);
  });

  it('should search groups by title and direct chats by the other participant', async () => {
    const repository = new ChatRepository();
    const ana = await createUser('Ana Souza', 'ana');
    const bruno = await createUser('Bruno Lima', 'bruno');
    const carla = await createUser('Carla Dias', 'carla');
    const { chat: withBruno } = await repository.createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    const group = await repository.createGroup({
      initiatorId: ana.id,
      title: 'Viagem Bruno',
      participantIds: [bruno.id, carla.id],
    });
    await repository.createDirectChat({ initiatorId: ana.id, participantId: carla.id });

    const byName = await repository.findByParticipant({
      userId: ana.id,
      value: 'brun:*',
      limit: 20,
    });
    const byNickname = await repository.findByParticipant({
      userId: ana.id,
      value: 'carla:*',
      limit: 20,
    });
    const bySelf = await repository.findByParticipant({
      userId: ana.id,
      value: 'ana:*',
      limit: 20,
    });

    expect(byName.map((chat) => chat.id)).toEqual([group.id, withBruno.id]);
    expect(byNickname.map((chat) => chat.isGroup)).toEqual([false]);
    expect(bySelf).toEqual([]);
  });
});
