import { MessageEntity } from '../entity/message.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';

export type PersistMessageData = Pick<
  MessageEntity,
  'id' | 'chatId' | 'senderId' | 'content' | 'createdAt'
>;

export type ChatMessage = Pick<MessageEntity, 'id' | 'content' | 'createdAt'> & {
  sender: Pick<UserEntity, 'id' | 'name'>;
};

export type FindMessagesByChatParams = {
  chatId: string;
  cursor?: string;
  limit: number;
};

export interface IMessageRepository {
  persist(data: PersistMessageData): Promise<void>;
  findByChat(params: FindMessagesByChatParams): Promise<ChatMessage[]>;
}
