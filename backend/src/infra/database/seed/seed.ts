import 'reflect-metadata';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v7 as uuidv7 } from 'uuid';
import {
  AppDataSource,
  destroyDataSource,
  initializeDataSource,
} from '@/infra/database/data-source';
import { logger as rootLogger } from '@/infra/logger';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { ChatParticipantEntity } from '@/modules/chats/entity/chat-participant.entity';
import { buildDirectKey } from '@/modules/chats/repository/chat.repository';
import { MessageEntity } from '@/modules/messages/entity/message.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { CreateUserSchema } from '@/modules/users/usecase/create/create-user.schema';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { env } from '@/shared/environment/env';
import { hash } from '@/shared/utils/hash';
import { DIRECT_CONVERSATION } from './direct-conversation';
import { GROUP_CONVERSATION } from './group-conversation';

type Profile = Pick<UserEntity, 'name' | 'nickname' | 'email'>;

type ChatInput = {
  isGroup: boolean;
  title: string | null;
  participantIds: string[];
  conversation: [number, string][];
  lastMessageAt: number;
};

type ChatSeed = {
  chat: Pick<ChatEntity, 'id' | 'isGroup' | 'title' | 'directKey' | 'createdBy' | 'createdAt'>;
  participants: Pick<ChatParticipantEntity, 'chatId' | 'userId'>[];
  messages: Pick<MessageEntity, 'id' | 'chatId' | 'senderId' | 'content' | 'createdAt'>[];
};

const logger = rootLogger.child('Seed');

const FAKER_SEED = 2026;
const PASSWORD = '#Demo2026';
const MAIN_USER: Profile = {
  name: 'João Marcos',
  nickname: 'joaomarcos',
  email: 'jmcsjoaomarcos@gmail.com',
};
const USERS_TOTAL = 2000;
const DEACTIVATED_USERS_TOTAL = 500;
const GROUP_SIZE_RULES = [
  { total: 10, min: 201, max: 300 },
  { total: 20, min: 100, max: 100 },
  { total: 30, min: 10, max: 10 },
  { total: 40, min: 3, max: 200 },
];
const GROUP_THEMES = [
  'Galera de',
  'Futebol de quinta em',
  'Churrasco em',
  'Corrida de rua em',
  'Pais da escola de',
  'Trilhas em',
  'Devs de',
  'Vôlei de praia em',
  'Clube do livro de',
  'Viagem para',
  'Vizinhos de',
  'Faculdade de',
];
const GROUP_EMOJIS = ['🔥', '⚽', '🎉', '📚', '🎮', '🍕', '🏖️', '🎶'];
const LAST_MESSAGE_CONTENT_MAX_LENGTH = 100;
const INSERT_CHUNK_SIZE = 1000;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const USERS_START_OFFSET = 400 * DAY;
const USERS_SPAN = 360 * DAY;
const CHAT_LIST_GAP = 20 * MINUTE;

const toNicknamePart = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[^A-Za-z0-9]/g, '')
    .toLowerCase();

const buildProfile = (index: number): Profile => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const separator = index % 2 === 0 ? '.' : '_';
  const nickname = `${toNicknamePart(firstName)}${separator}${toNicknamePart(lastName)}${index}`;

  return { name: `${firstName} ${lastName}`, nickname, email: `${nickname}@example.com` };
};

const buildUsers = (passwordHash: string, now: number): UserEntity[] => {
  const profiles = [
    MAIN_USER,
    ...Array.from({ length: USERS_TOTAL - 1 }, (_, index) => buildProfile(index + 1)),
  ];
  const deactivatedIndexes = new Set(
    faker.helpers.arrayElements(
      profiles.slice(1).map((_, index) => index + 1),
      DEACTIVATED_USERS_TOTAL,
    ),
  );

  return profiles.map((profile, index) => {
    const { name, nickname, email } = CreateUserSchema.parse({ ...profile, password: PASSWORD });
    const createdAt = new Date(
      now - USERS_START_OFFSET + Math.floor((index * USERS_SPAN) / USERS_TOTAL),
    );

    return {
      id: uuidv7({ msecs: createdAt.getTime() }),
      name,
      nickname,
      email,
      password: passwordHash,
      status: deactivatedIndexes.has(index) ? UserStatus.DEACTIVATED : UserStatus.ACTIVE,
      createdAt,
      updatedAt: createdAt,
    };
  });
};

const buildTimeline = (lastMessageAt: number, total: number): number[] => {
  const timeline = [lastMessageAt];

  while (timeline.length < total) {
    timeline.push(timeline[timeline.length - 1] - faker.number.int({ min: 20_000, max: 240_000 }));
  }

  return timeline.reverse();
};

const buildChat = ({
  isGroup,
  title,
  participantIds,
  conversation,
  lastMessageAt,
}: ChatInput): ChatSeed => {
  const timeline = buildTimeline(lastMessageAt, conversation.length);
  const createdAt = new Date(timeline[0] - faker.number.int({ min: HOUR, max: 2 * DAY }));
  const id = uuidv7({ msecs: createdAt.getTime() });

  return {
    chat: {
      id,
      isGroup,
      title,
      directKey: isGroup ? null : buildDirectKey([participantIds[0], participantIds[1]]),
      createdBy: faker.helpers.arrayElement(participantIds),
      createdAt,
    },
    participants: participantIds.map((userId) => ({ chatId: id, userId })),
    messages: conversation.map(([speaker, content], index) => ({
      id: uuidv7({ msecs: timeline[index] }),
      chatId: id,
      senderId: participantIds[speaker % participantIds.length],
      content,
      createdAt: new Date(timeline[index]),
    })),
  };
};

const buildGroupSizes = (): number[] =>
  faker.helpers.shuffle(
    GROUP_SIZE_RULES.flatMap(({ total, min, max }) =>
      Array.from({ length: total }, () => faker.number.int({ min, max })),
    ),
  );

const buildGroupTitle = (): string => {
  const title = `${faker.helpers.arrayElement(GROUP_THEMES)} ${faker.location.city()}`;

  return faker.datatype.boolean({ probability: 0.2 })
    ? `${title} ${faker.helpers.arrayElement(GROUP_EMOJIS)}`
    : title;
};

const buildChats = ([mainUser, ...others]: UserEntity[], now: number): ChatSeed[] => {
  const groupSizes = buildGroupSizes();
  const activeContacts = faker.helpers.arrayElements(
    others.filter(({ status }) => status === UserStatus.ACTIVE),
    groupSizes.length,
  );
  const deactivatedContacts = faker.helpers.arrayElements(
    others.filter(({ status }) => status === UserStatus.DEACTIVATED),
    groupSizes.length,
  );
  const lastMessageAt = (position: number): number => now - (position + 1) * CHAT_LIST_GAP;

  return groupSizes.flatMap((size, index) => [
    buildChat({
      isGroup: false,
      title: null,
      participantIds: [mainUser.id, activeContacts[index].id],
      conversation: DIRECT_CONVERSATION,
      lastMessageAt: lastMessageAt(index * 3),
    }),
    buildChat({
      isGroup: true,
      title: buildGroupTitle(),
      participantIds: [
        mainUser.id,
        ...faker.helpers.arrayElements(others, size - 1).map(({ id }) => id),
      ],
      conversation: GROUP_CONVERSATION,
      lastMessageAt: lastMessageAt(index * 3 + 1),
    }),
    buildChat({
      isGroup: false,
      title: null,
      participantIds: [mainUser.id, deactivatedContacts[index].id],
      conversation: DIRECT_CONVERSATION,
      lastMessageAt: lastMessageAt(index * 3 + 2),
    }),
  ]);
};

const insertInChunks = async <T extends ObjectLiteral>(
  manager: EntityManager,
  entity: EntityTarget<T>,
  rows: QueryDeepPartialEntity<T>[],
): Promise<void> => {
  for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
    await manager
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(rows.slice(start, start + INSERT_CHUNK_SIZE))
      .updateEntity(false)
      .execute();
  }
};

const updateLastMessages = async (manager: EntityManager, chats: ChatSeed[]): Promise<void> => {
  for (const { chat, messages } of chats) {
    const lastMessage = messages[messages.length - 1];

    await manager
      .createQueryBuilder()
      .update(ChatEntity)
      .set({
        lastMessageId: lastMessage.id,
        lastMessageContent: Array.from(lastMessage.content)
          .slice(0, LAST_MESSAGE_CONTENT_MAX_LENGTH)
          .join(''),
      })
      .where('id = :id', { id: chat.id })
      .updateEntity(false)
      .execute();
  }
};

const run = async (): Promise<void> => {
  if (env.ENVIRONMENT === 'production') {
    throw new Error('Seed cannot run in production');
  }

  await initializeDataSource();

  try {
    if (await AppDataSource.getRepository(UserEntity).exists()) {
      logger.info('Seed skipped: database already has users');
      return;
    }

    faker.seed(FAKER_SEED);

    const now = Date.now();
    const users = buildUsers(await hash.generate(PASSWORD), now);
    const chats = buildChats(users, now);
    const participants = chats.flatMap(({ participants }) => participants);
    const messages = chats.flatMap(({ messages }) => messages);

    await AppDataSource.transaction(async (manager) => {
      await insertInChunks(manager, UserEntity, users);
      await insertInChunks(
        manager,
        ChatEntity,
        chats.map(({ chat }) => chat),
      );
      await insertInChunks(manager, ChatParticipantEntity, participants);
      await insertInChunks(manager, MessageEntity, messages);
      await updateLastMessages(manager, chats);
    });

    logger.info('Seed finished', {
      data: {
        users: users.length,
        chats: chats.length,
        participants: participants.length,
        messages: messages.length,
      },
    });
  } finally {
    await destroyDataSource();
  }
};

run().catch((error) => {
  logger.error('Seed failed', { error });
  process.exitCode = 1;
});
