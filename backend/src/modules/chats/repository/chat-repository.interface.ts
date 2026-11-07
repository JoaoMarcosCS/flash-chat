import { ChatEntity } from '../entity/chat.entity';
import { UserEntity } from '@/modules/users/entity/user.entity';

export type ChatParticipant = Pick<UserEntity, 'id' | 'name' | 'nickname' | 'status'>;

export type ChatDetails = Pick<
  ChatEntity,
  'id' | 'isGroup' | 'title' | 'createdBy' | 'createdAt'
> & {
  participants: ChatParticipant[];
};

export type CreateDirectChatData = {
  initiatorId: string;
  participantId: string;
};

export type CreateGroupData = {
  initiatorId: string;
  title: string;
  participantIds: string[];
};

export type ChatListItem = Pick<ChatEntity, 'id' | 'isGroup' | 'title'> & {
  otherParticipant: Pick<UserEntity, 'name' | 'status'> | null;
  lastMessage: {
    id: string;
    content: string | null;
    sender: Pick<UserEntity, 'id' | 'name'>;
  } | null;
};

export type FindChatsByParticipantParams = {
  userId: string;
  value?: string;
  isGroup?: boolean;
  cursor?: string;
  limit: number;
};

export interface IChatRepository {
  createDirectChat(data: CreateDirectChatData): Promise<ChatDetails>;
  findDirectChat(userIds: [string, string]): Promise<ChatEntity | null>;
  createGroup(data: CreateGroupData): Promise<ChatDetails>;
  findById(chatId: string, userId: string): Promise<ChatDetails | null>;
  findByParticipant(params: FindChatsByParticipantParams): Promise<ChatListItem[]>;
  enrichWithParticipants(chat: ChatEntity): Promise<ChatDetails>;
}
