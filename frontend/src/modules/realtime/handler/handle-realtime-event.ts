import type { QueryClient } from '@tanstack/react-query';
import type { RealtimeEvent } from '../interface/realtime-event.interface';
import { addCreatedChat, applyLastMessage } from '@/modules/chats/cache/chats-cache';
import { useLiveMessagesStore } from '@/modules/messages/store/live-messages.store';

export function handleRealtimeEvent(
  queryClient: QueryClient,
  event: RealtimeEvent,
  userId: string,
) {
  const liveMessages = useLiveMessagesStore.getState();

  switch (event.type) {
    case 'chat.created':
      addCreatedChat(queryClient, event.data.chat, userId);
      break;
    case 'message.published': {
      const { message } = event.data;
      liveMessages.receive(message);
      void applyLastMessage(
        queryClient,
        message.chatId,
        { id: message.id, content: message.content, sender: message.sender },
        userId,
      ).catch(() => undefined);
      break;
    }
    case 'message.persisted':
      liveMessages.markPersisted(event.data.message.id);
      break;
  }
}
