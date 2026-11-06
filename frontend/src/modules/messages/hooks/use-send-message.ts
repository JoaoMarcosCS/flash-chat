import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { sendMessageRequest } from '../service/send-message.request';
import { useLiveMessagesStore } from '../store/live-messages.store';
import { markChatReadOnly } from '@/modules/chats/cache/chats-cache';
import { useSessionStore } from '@/stores/session.store';

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();

  const deliver = async (clientId: string, content: string) => {
    const store = useLiveMessagesStore.getState();
    try {
      const published = await sendMessageRequest({ chatId, content });
      store.markPublished(chatId, clientId, published);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        store.remove(chatId, clientId);
        markChatReadOnly(queryClient, chatId);
        return;
      }
      store.setStatus(chatId, clientId, 'failed');
    }
  };

  const send = (content: string) => {
    const user = useSessionStore.getState().user;
    if (!user) return;

    const clientId = crypto.randomUUID();
    useLiveMessagesStore.getState().addPending(chatId, {
      id: clientId,
      clientId,
      content,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name },
      status: 'pending',
    });
    void deliver(clientId, content);
  };

  const retry = (clientId: string, content: string) => {
    useLiveMessagesStore.getState().setStatus(chatId, clientId, 'pending');
    void deliver(clientId, content);
  };

  const discard = (clientId: string) => useLiveMessagesStore.getState().remove(chatId, clientId);

  return { send, retry, discard };
}
