import { ChatDetails, ChatListItem } from '../repository/IChatRepository';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

export type ChatResponse = Omit<ChatDetails, 'participants'> & {
  readOnly: boolean;
  participants: Pick<ChatDetails['participants'][number], 'id' | 'name' | 'nickname'>[];
};

export type ChatListItemResponse = Pick<ChatListItem, 'id' | 'isGroup' | 'lastMessage'> & {
  displayName: string;
  readOnly: boolean;
};

export const toChatResponse = ({ participants, ...chat }: ChatDetails): ChatResponse => ({
  id: chat.id,
  isGroup: chat.isGroup,
  title: chat.title,
  createdBy: chat.createdBy,
  createdAt: chat.createdAt,
  readOnly: !chat.isGroup && participants.some(({ status }) => status === UserStatus.DEACTIVATED),
  participants: participants.map(({ id, name, nickname }) => ({ id, name, nickname })),
});

export const toChatListItemResponse = (item: ChatListItem): ChatListItemResponse => ({
  id: item.id,
  isGroup: item.isGroup,
  displayName: (item.isGroup ? item.title : item.otherParticipant?.name) ?? '',
  readOnly: !item.isGroup && item.otherParticipant?.status === UserStatus.DEACTIVATED,
  lastMessage: item.lastMessage,
});
