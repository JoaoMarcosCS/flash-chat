import type { Chat } from '@/modules/chats/interface/chat.interface';
import type {
  DeletedMessage,
  EditedMessage,
  PublishedMessage,
} from '@/modules/messages/interface/message.interface';

export type RealtimeEvent =
  | { type: 'chat.created'; data: { chat: Chat } }
  | { type: 'message.published'; data: { message: PublishedMessage } }
  | { type: 'message.persisted'; data: { message: { id: string; chatId: string } } }
  | { type: 'message.edited'; data: { message: EditedMessage } }
  | { type: 'message.deleted'; data: { message: DeletedMessage } };

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed';
