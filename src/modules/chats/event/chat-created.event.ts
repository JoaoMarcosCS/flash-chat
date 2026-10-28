import { ChatResponse } from '../mapper/chat.mapper';
import { Queue } from '@/infra/queue/queue.provider';
import { ILogger } from '@/infra/logger/ILogger';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';

export type ChatCreatedEvent = {
  participantIds: string[];
  chat: ChatResponse;
};

export const publishChatCreated = async (chat: ChatResponse, logger: ILogger): Promise<void> => {
  const event: ChatCreatedEvent = {
    participantIds: chat.participants.map(({ id }) => id),
    chat,
  };

  try {
    await Queue.publishExchange(Exchange.EVENTS, RoutingKey.CHAT_CREATED, event);
  } catch (error) {
    logger.error('Failed to publish chat.created', { chatId: chat.id, error });
  }
};
