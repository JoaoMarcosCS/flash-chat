import type { PublicUser } from '@/modules/users/interface/user.interface';

export type ChatType = 'direct' | 'group';

export interface Chat {
  id: string;
  isGroup: boolean;
  title: string | null;
  createdBy: string;
  createdAt: string;
  readOnly: boolean;
  participants: PublicUser[];
}

export interface LastMessage {
  id: string;
  content: string;
  sender: { id: string; name: string };
}

export interface ChatListItem {
  id: string;
  isGroup: boolean;
  displayName: string;
  readOnly: boolean;
  lastMessage: LastMessage | null;
}
