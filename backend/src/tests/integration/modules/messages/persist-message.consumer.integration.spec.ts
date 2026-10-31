import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { v7 as uuidv7 } from 'uuid';
import { AppDataSource } from '@/infra/database/data-source';
import { logger } from '@/infra/logger';
import { RabbitMQQueueProvider } from '@/infra/queue/rabbitmq-queue.provider';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { PersistMessageConsumer } from '@/modules/messages/consumer/persist-message.consumer';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { MessagePublishedEvent } from '@/modules/messages/event/message-published.event';
import { MessageRepository } from '@/modules/messages/repository/message.repository';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { createUser, listenEvents, TestUser } from '../chats/chat-fixtures';

const waitFor = async <T>(read: () => Promise<T | null | false>): Promise<T> => {
  const deadline = Date.now() + 5000;

  while (Date.now() < deadline) {
    const value = await read();

    if (value) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Timed out waiting for condition');
};

describe('PersistMessageConsumer (integração)', () => {
  let provider: RabbitMQQueueProvider;
  let ana: TestUser;
  let bruno: TestUser;
  let chatId: string;

  const publish = (id: string, content: string) => {
    const event: MessagePublishedEvent = {
      participantIds: [ana.id, bruno.id],
      message: {
        id,
        chatId,
        content,
        createdAt: new Date(),
        sender: { id: ana.id, name: ana.name },
      },
    };

    return provider.publishExchange(Exchange.EVENTS, RoutingKey.MESSAGE_PUBLISHED, event);
  };

  beforeEach(async () => {
    provider = new RabbitMQQueueProvider(logger);
    ana = await createUser('Ana Souza', 'ana');
    bruno = await createUser('Bruno Lima', 'bruno');
    const { chat } = await new ChatRepository().createDirectChat({
      initiatorId: ana.id,
      participantId: bruno.id,
    });
    chatId = chat.id;
    await new PersistMessageConsumer(new MessageRepository(), provider, logger).start();
  });

  afterEach(async () => {
    await provider.close();
  });

  it('should persist a published message, update the last message and notify the sender', async () => {
    const listener = await listenEvents(RoutingKey.MESSAGE_PERSISTED);
    const id = uuidv7();

    await publish(id, 'Oi, tudo bem?');

    const message = await waitFor(() =>
      AppDataSource.getRepository(MessageEntity).findOneBy({ id }),
    );
    const persisted = await waitFor(async () => {
      const events = await listener.received();
      return events.length > 0 && events;
    });

    expect(message).toMatchObject({ chatId, senderId: ana.id, content: 'Oi, tudo bem?' });
    expect(await AppDataSource.getRepository(ChatEntity).findOneBy({ id: chatId })).toMatchObject({
      lastMessageId: id,
      lastMessageContent: 'Oi, tudo bem?',
    });
    expect(persisted).toEqual([{ participantIds: [ana.id], message: { id, chatId } }]);
    await listener.close();
  });

  it('should keep a single message and notify again on redelivery', async () => {
    const listener = await listenEvents(RoutingKey.MESSAGE_PERSISTED);
    const id = uuidv7();
    const events: unknown[] = [];

    await publish(id, 'Oi');
    await publish(id, 'Oi');

    await waitFor(async () => {
      events.push(...(await listener.received()));
      return events.length === 2;
    });

    expect(await AppDataSource.getRepository(MessageEntity).countBy({ id })).toBe(1);
    await listener.close();
  });
});
