import { Repository } from 'typeorm';
import {
  ChatMessage,
  DeleteMessageData,
  EditMessageData,
  FindMessagesByChatParams,
  IMessageRepository,
  MessageDetails,
  PersistMessageData,
} from './message-repository.interface';
import { AppDataSource } from '@/infra/database/data-source';
import { MessageEntity } from '../entity/message.entity';
import { ChatEntity } from '@/modules/chats/entity/chat.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { ContentStatus } from '@/shared/enums/messages/content-status.enum';

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
        'm.content_status AS "contentStatus"',
        'm.created_at AS "createdAt"',
        'm.edited_at AS "editedAt"',
        'm.deleted_at AS "deletedAt"',
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

  async findById(id: string, chatId: string): Promise<MessageDetails | null> {
    const message = await this.repository
      .createQueryBuilder('m')
      .select(['m.id', 'm.chatId', 'm.senderId', 'm.content', 'm.contentStatus', 'm.editedAt'])
      .where('m.id = :id', { id })
      .andWhere('m.chat_id = :chatId', { chatId })
      .getOne();

    return message ?? null;
  }

  async edit({ id, chatId, content, editedAt }: EditMessageData): Promise<boolean> {
    return AppDataSource.transaction(async (manager) => {
      const { affected } = await manager
        .createQueryBuilder()
        .update(MessageEntity)
        .set({ content, contentStatus: ContentStatus.EDITED, editedAt })
        .where('id = :id', { id })
        .andWhere('chat_id = :chatId', { chatId })
        .andWhere('content_status <> :deleted', { deleted: ContentStatus.DELETED })
        .updateEntity(false)
        .execute();

      if (!affected) {
        return false;
      }

      await manager
        .createQueryBuilder()
        .update(ChatEntity)
        .set({ lastMessageContent: truncate(content, LAST_MESSAGE_CONTENT_MAX_LENGTH) })
        .where('id = :chatId', { chatId })
        .andWhere('last_message_id = :id', { id })
        .updateEntity(false)
        .execute();

      return true;
    });
  }

  async delete({ id, chatId, deletedAt }: DeleteMessageData): Promise<boolean> {
    return AppDataSource.transaction(async (manager) => {
      const { affected } = await manager
        .createQueryBuilder()
        .update(MessageEntity)
        .set({ content: null, contentStatus: ContentStatus.DELETED, deletedAt })
        .where('id = :id', { id })
        .andWhere('chat_id = :chatId', { chatId })
        .andWhere('content_status <> :deleted', { deleted: ContentStatus.DELETED })
        .updateEntity(false)
        .execute();

      if (!affected) {
        return false;
      }

      await manager
        .createQueryBuilder()
        .update(ChatEntity)
        .set({ lastMessageContent: null })
        .where('id = :chatId', { chatId })
        .andWhere('last_message_id = :id', { id })
        .updateEntity(false)
        .execute();

      return true;
    });
  }
}

const truncate = (value: string, maxLength: number): string =>
  Array.from(value).slice(0, maxLength).join('');
