import { useMemo } from 'react';
import type { ChatMessage } from '../interface/message.interface';
import { useLiveMessagesStore } from '../store/live-messages.store';
import { useMessagesQuery } from './use-messages-query';
import { flattenPages } from '@/lib/paginated';

const NO_MESSAGES: ChatMessage[] = [];

export function useChatMessages(chatId: string, enabled: boolean) {
  const query = useMessagesQuery(chatId, enabled);
  const live = useLiveMessagesStore((state) => state.byChat[chatId] ?? NO_MESSAGES);

  const messages = useMemo((): ChatMessage[] => {
    const liveIds = new Set(live.map((message) => message.id));
    const persistedIds = new Set<string>();
    const history = flattenPages(query.data)
      .filter((message) => {
        persistedIds.add(message.id);
        return !liveIds.has(message.id);
      })
      .map((message): ChatMessage => ({ ...message, status: 'persisted' }));
    const confirmed = live.map((message) =>
      message.status === 'published' && persistedIds.has(message.id)
        ? { ...message, status: 'persisted' as const }
        : message,
    );
    return [...history, ...confirmed].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [query.data, live]);

  return { messages, query };
}
