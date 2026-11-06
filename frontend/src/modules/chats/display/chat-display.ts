import type { Chat, ChatListItem, ChatType, LastMessage } from '../interface/chat.interface';
import type { PublicUser } from '@/modules/users/interface/user.interface';

const CHAT_TYPE_PATHS: Record<ChatType, string> = {
  direct: '/chats',
  group: '/groups',
};

export function getChatType(chat: Pick<Chat, 'isGroup'>): ChatType {
  return chat.isGroup ? 'group' : 'direct';
}

export function getChatTypePath(type: ChatType): string {
  return CHAT_TYPE_PATHS[type];
}

export function getChatHref(chat: Pick<Chat, 'id' | 'isGroup'>): string {
  return `${getChatTypePath(getChatType(chat))}/${chat.id}`;
}

export function getOtherParticipant(chat: Chat, userId: string): PublicUser | undefined {
  return chat.participants.find((participant) => participant.id !== userId);
}

export function getChatDisplayName(chat: Chat, userId: string): string {
  if (chat.isGroup) return chat.title ?? '';
  return getOtherParticipant(chat, userId)?.name ?? '';
}

export function toChatListItem(
  chat: Chat,
  userId: string,
  lastMessage: LastMessage | null = null,
): ChatListItem {
  return {
    id: chat.id,
    isGroup: chat.isGroup,
    displayName: getChatDisplayName(chat, userId),
    readOnly: chat.readOnly,
    lastMessage,
  };
}
