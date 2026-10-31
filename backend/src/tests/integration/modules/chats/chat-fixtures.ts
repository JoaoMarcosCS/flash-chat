import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { generateTokens } from '@/modules/auth/token/token';
import { connect } from 'amqplib';
import { env } from '@/shared/environment/env';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';

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

export const listenEvents = async (routingKey: RoutingKey) => {
  const connection = await connect({
    hostname: env.RABBITMQ_HOST,
    port: env.RABBITMQ_PORT,
    username: env.RABBITMQ_USER,
    password: env.RABBITMQ_PASS,
  });
  const channel = await connection.createChannel();
  await channel.assertExchange(Exchange.EVENTS, 'topic', { durable: true });
  const { queue } = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(queue, Exchange.EVENTS, routingKey);

  const received = async (): Promise<unknown[]> => {
    const events: unknown[] = [];
    let message = await channel.get(queue, { noAck: true });

    while (message) {
      events.push(JSON.parse(message.content.toString()));
      message = await channel.get(queue, { noAck: true });
    }

    return events;
  };

  return { received, close: () => connection.close() };
};

export const listenChatCreated = () => listenEvents(RoutingKey.CHAT_CREATED);
