import { Repository } from 'typeorm';
import {
  ChatMessage,
  FindMessagesByChatParams,
  IMessageRepository,
  PersistMessageData,
} from './message-repository.interface';
import { AppDataSource } from '@/infra/database/data-source';
import { MessageEntity } from '../entity/message.entity';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';

const LAST_MESSAGE_CONTENT_MAX_LENGTH = 100;

export class MessageRepository implements IMessageRepository {
  private repository: Repository<MessageEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(MessageEntity);
  }

  async persist(data: PersistMessageData): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(MessageEntity)
        .values(data)
        .orIgnore()
        .updateEntity(false)
        .execute();

      await manager
        .createQueryBuilder()
        .update(ChatEntity)
        .set({
          lastMessageId: data.id,
          lastMessageContent: truncate(data.content, LAST_MESSAGE_CONTENT_MAX_LENGTH),
        })
        .where('id = :chatId', { chatId: data.chatId })
        .andWhere('(last_message_id IS NULL OR last_message_id < :id)', { id: data.id })
        .updateEntity(false)
        .execute();
    });
  }

  async findByChat({ chatId, cursor, limit }: FindMessagesByChatParams): Promise<ChatMessage[]> {
    const builder = this.repository
      .createQueryBuilder('m')
      .innerJoin(UserEntity, 'u', 'u.id = m.sender_id')
      .select([
        'm.id AS "id"',
        'm.content AS "content"',
        'm.created_at AS "createdAt"',
        `json_build_object('id', u.id, 'name', u.name) AS "sender"`,
      ])
      .where('m.chat_id = :chatId', { chatId })
      .orderBy('m.id', 'DESC')
      .limit(limit);

    if (cursor) {
      builder.andWhere('m.id < :cursor', { cursor });
    }

    return builder.getRawMany<ChatMessage>();
  }
}

const truncate = (value: string, maxLength: number): string =>
  Array.from(value).slice(0, maxLength).join('');
