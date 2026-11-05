import { ChatResponse } from '../mapper/chat.mapper';

export type ChatCreatedEvent = {
  participantIds: string[];
  chat: ChatResponse;
};
