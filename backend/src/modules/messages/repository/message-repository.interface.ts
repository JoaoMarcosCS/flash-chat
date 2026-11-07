import { MessageEntity } from '../entity/message.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';

export type PersistMessageData = Pick<MessageEntity, 'id' | 'chatId' | 'senderId' | 'createdAt'> & {
  content: string;
};

export type ChatMessage = Pick<
  MessageEntity,
  'id' | 'content' | 'contentStatus' | 'createdAt' | 'editedAt' | 'deletedAt'
> & {
  sender: Pick<UserEntity, 'id' | 'name'>;
};

export type MessageDetails = Pick<
  MessageEntity,
  'id' | 'chatId' | 'senderId' | 'content' | 'contentStatus' | 'editedAt'
>;

export type FindMessagesByChatParams = {
  chatId: string;
  cursor?: string;
  limit: number;
};

export type EditMessageData = {
  id: string;
  chatId: string;
  content: string;
  editedAt: Date;
};

export type DeleteMessageData = {
  id: string;
  chatId: string;
  deletedAt: Date;
};

export interface IMessageRepository {
  persist(data: PersistMessageData): Promise<void>;
  findByChat(params: FindMessagesByChatParams): Promise<ChatMessage[]>;
  findById(id: string, chatId: string): Promise<MessageDetails | null>;
  edit(data: EditMessageData): Promise<boolean>;
  delete(data: DeleteMessageData): Promise<boolean>;
}
