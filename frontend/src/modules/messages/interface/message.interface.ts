export interface MessageSender {
  id: string;
  name: string;
}

export type ContentStatus = 'original' | 'edited' | 'deleted';

export interface Message {
  id: string;
  content: string | null;
  createdAt: string;
  sender: MessageSender;
  contentStatus?: ContentStatus;
  editedAt?: string | null;
  deletedAt?: string | null;
}

export type MessageChange = Pick<Message, 'content' | 'contentStatus' | 'editedAt' | 'deletedAt'>;

export type MessageStatus = 'pending' | 'published' | 'persisted' | 'failed';

export interface ChatMessage extends Message {
  clientId?: string;
  status?: MessageStatus;
}

export interface PublishedMessage extends Message {
  chatId: string;
  content: string;
}

export interface EditedMessage {
  id: string;
  chatId: string;
  content: string;
  editedAt: string;
}

export interface DeletedMessage {
  id: string;
  chatId: string;
  deletedAt: string;
}
