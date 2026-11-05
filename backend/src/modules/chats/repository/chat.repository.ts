import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import {
  ChatDetails,
  ChatListItem,
  ChatParticipant,
  CreateDirectChatData,
  CreateGroupData,
  FindChatsByParticipantParams,
  IChatRepository,
} from './chat-repository.interface';
import { AppDataSource } from '@/infra/database/data-source';
import { ChatEntity } from '../entity/chat.entity';
import { ChatParticipantEntity } from '../entity/chat-participant.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { MessageEntity } from '@/modules/messages/entity/message.entity';

const CHAT_COLUMNS = ['c.id', 'c.isGroup', 'c.title', 'c.createdBy', 'c.createdAt'];

const TITLE_SEARCH_VECTOR = `to_tsvector('simple', coalesce(c.title, ''))`;

const USER_SEARCH_VECTOR = `to_tsvector('simple', coalesce(ou.name, '') || ' ' || coalesce(ou.nickname, ''))`;

export class ChatRepository implements IChatRepository {
  private repository: Repository<ChatEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ChatEntity);
  }

  async enrichWithParticipants(chat: ChatEntity): Promise<ChatDetails> {
    const participants = await AppDataSource.manager
      .createQueryBuilder(ChatParticipantEntity, 'cp')
      .innerJoin(UserEntity, 'u', 'u.id = cp.user_id')
      .select([
        'u.id AS "id"',
        'u.name AS "name"',
        'u.nickname AS "nickname"',
        'u.status AS "status"',
      ])
      .where('cp.chat_id = :chatId', { chatId: chat.id })
      .orderBy('u.name', 'ASC')
      .addOrderBy('u.id', 'ASC')
      .getRawMany<ChatParticipant>();

    return {
      id: chat.id,
      isGroup: chat.isGroup,
      title: chat.title,
      createdBy: chat.createdBy,
      createdAt: chat.createdAt,
      participants,
    };
  }

  async createDirectChat({
    initiatorId,
    participantId,
  }: CreateDirectChatData): Promise<ChatDetails> {
    const chat = await AppDataSource.transaction(async (manager) => {
      const participantIds = [initiatorId, participantId];

      const chatToInsert = {
        isGroup: false,
        id: uuidv7(),
        title: null,
        directKey: buildDirectKey([initiatorId, participantId]),
        createdBy: initiatorId,
        participantIds,
      };

      const { raw } = await manager
        .createQueryBuilder()
        .insert()
        .into(ChatEntity)
        .values(chatToInsert)
        .updateEntity(false)
        .returning(['id', 'isGroup', 'title', 'createdBy', 'createdAt'])
        .execute();

      const [row] = raw;

      await manager
        .createQueryBuilder()
        .insert()
        .into(ChatParticipantEntity)
        .values(participantIds.map((userId) => ({ chatId: row.id, userId })))
        .updateEntity(false)
        .execute();

      return {
        id: row.id,
        isGroup: row.is_group,
        title: row.title,
        createdBy: row.created_by,
        createdAt: row.created_at,
      } as ChatEntity;
    });

    const chatWithParticipants = await this.enrichWithParticipants(chat);

    return chatWithParticipants;
  }

  async findDirectChat(userIds: [string, string]): Promise<ChatEntity | null> {
    const chat = await this.repository
      .createQueryBuilder('c')
      .select(CHAT_COLUMNS)
      .where('c.directKey = :directKey', { directKey: buildDirectKey(userIds) }) // busca chat direto pela chave única
      .getOne();

    return chat || null;
  }

  async createGroup({ initiatorId, title, participantIds }: CreateGroupData): Promise<ChatDetails> {
    const chat = await AppDataSource.transaction(async (manager) => {
      const participantIdsToInsert = [initiatorId, ...participantIds];

      const chatToInsert = {
        isGroup: true,
        id: uuidv7(),
        title,
        createdBy: initiatorId,
        participantIdsToInsert,
      };

      const { raw } = await manager
        .createQueryBuilder()
        .insert()
        .into(ChatEntity)
        .values(chatToInsert)
        .updateEntity(false)
        .returning(['id', 'isGroup', 'title', 'createdBy', 'createdAt'])
        .execute();

      const [row] = raw;

      await manager
        .createQueryBuilder()
        .insert()
        .into(ChatParticipantEntity)
        .values(participantIdsToInsert.map((userId) => ({ chatId: row.id, userId })))
        .updateEntity(false)
        .execute();

      return {
        id: row.id,
        isGroup: row.is_group,
        title: row.title,
        createdBy: row.created_by,
        createdAt: row.created_at,
      } as ChatEntity;
    });

    const chatWithParticipants = await this.enrichWithParticipants(chat);

    return chatWithParticipants;
  }

  async findById(chatId: string, userId: string): Promise<ChatDetails | null> {
    const chat = await this.repository
      .createQueryBuilder('c')
      .select(CHAT_COLUMNS)
      .innerJoin(ChatParticipantEntity, 'me', 'me.chat_id = c.id AND me.user_id = :userId', {
        userId,
      })
      .where('c.id = :chatId', { chatId })
      .getOne();

    return chat ? this.enrichWithParticipants(chat) : null;
  }

  async findByParticipant({
    userId,
    value,
    isGroup,
    cursor,
    limit,
  }: FindChatsByParticipantParams): Promise<ChatListItem[]> {
    const builder = this.repository
      .createQueryBuilder('c')
      .select([
        'c.id AS "id"',
        'c.is_group AS "isGroup"',
        'c.title AS "title"',
        `CASE WHEN ou.id IS NULL THEN NULL
      ELSE json_build_object('name', ou.name, 'status', ou.status) END AS "otherParticipant"`,
        `CASE WHEN c.last_message_id IS NULL THEN NULL
      ELSE json_build_object(
        'id', c.last_message_id,
        'content', c.last_message_content,
        'sender', json_build_object('id', s.id, 'name', s.name)
      ) END AS "lastMessage"`,
      ])
      .innerJoin(ChatParticipantEntity, 'me', 'me.chat_id = c.id AND me.user_id = :userId', {
        userId,
      }) // somente os chats que o usuário da busca participa
      .leftJoin(
        ChatParticipantEntity,
        'op',
        'op.chat_id = c.id AND op.user_id <> :userId AND c.is_group = false',
      ) // busca o outro participante do chat direto (se houver)
      .leftJoin(UserEntity, 'ou', 'ou.id = op.user_id')
      .leftJoin(MessageEntity, 'm', 'm.id = c.last_message_id') // busca o sender da última mensagem (se houver)
      .leftJoin(UserEntity, 's', 's.id = m.sender_id')
      .orderBy('COALESCE(c.last_message_id, c.id)', 'DESC')
      .limit(limit);

    if (value) {
      builder.andWhere(
        `((c.is_group = true AND ${TITLE_SEARCH_VECTOR} @@ to_tsquery('simple', :value))
          OR (c.is_group = false AND ${USER_SEARCH_VECTOR} @@ to_tsquery('simple', :value)))`,
        { value },
      );
    }

    if (isGroup !== undefined) {
      builder.andWhere('c.is_group = :isGroup', { isGroup });
    }

    if (cursor) {
      builder.andWhere('COALESCE(c.last_message_id, c.id) < :cursor', { cursor });
    }

    return builder.getRawMany<ChatListItem>();
  }
}

// Função para gerar a chave única de um chat direto entre dois usuários
export const buildDirectKey = (userIds: [string, string]): string =>
  userIds
    .map((id) => id.toLowerCase())
    .sort()
    .join(':');
