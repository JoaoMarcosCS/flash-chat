export interface MessageSender {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: MessageSender;
}

export type MessageStatus = 'pending' | 'published' | 'persisted' | 'failed';

export interface ChatMessage extends Message {
  clientId?: string;
  status?: MessageStatus;
}

export interface PublishedMessage extends Message {
  chatId: string;
}
