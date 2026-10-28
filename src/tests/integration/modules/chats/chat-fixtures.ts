import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { generateTokens } from '@/modules/auth/token/token';

export type TestUser = { id: string; name: string; nickname: string; token: string };

export const createUser = async (
  name: string,
  nickname: string,
  status = UserStatus.ACTIVE,
): Promise<TestUser> => {
  const id = uuidv7();

  await AppDataSource.getRepository(UserEntity).insert({
    id,
    name,
    nickname,
    email: `${nickname}@example.com`,
    password: 'hashed',
    status,
  });

  return { id, name, nickname, token: generateTokens({ id, name, nickname }).accessToken };
};

export const deactivate = (user: TestUser) =>
  AppDataSource.getRepository(UserEntity).update(user.id, { status: UserStatus.DEACTIVATED });

export const sendMessage = async (chatId: string, sender: TestUser, content: string) => {
  const id = uuidv7();

  await AppDataSource.getRepository(MessageEntity).insert({
    id,
    chatId,
    senderId: sender.id,
    content,
    createdAt: new Date(),
  });
  await AppDataSource.getRepository(ChatEntity).update(chatId, {
    lastMessageId: id,
    lastMessageContent: content,
  });

  return id;
};

export const bearer = (user: TestUser) => `Bearer ${user.token}`;
