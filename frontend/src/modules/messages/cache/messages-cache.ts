import type { QueryClient } from '@tanstack/react-query';
import type {
  DeletedMessage,
  EditedMessage,
  Message,
  MessageChange,
} from '../interface/message.interface';
import { messagesQueryKey } from '../hooks/use-messages-query';
import { useLiveMessagesStore } from '../store/live-messages.store';
import type { InfinitePages } from '@/lib/paginated';
import { applyLastMessageContent } from '@/modules/chats/cache/chats-cache';

function applyChange(queryClient: QueryClient, chatId: string, id: string, change: MessageChange) {
  queryClient.setQueryData<InfinitePages<Message>>(messagesQueryKey(chatId), (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: page.data.map((message) => (message.id === id ? { ...message, ...change } : message)),
      })),
    };
  });
  useLiveMessagesStore.getState().applyChange(chatId, id, change);
  applyLastMessageContent(queryClient, chatId, id, change.content ?? null);
}

export function applyEditedMessage(
  queryClient: QueryClient,
  { id, chatId, content, editedAt }: EditedMessage,
) {
  applyChange(queryClient, chatId, id, { content, contentStatus: 'edited', editedAt });
}

export function applyDeletedMessage(
  queryClient: QueryClient,
  { id, chatId, deletedAt }: DeletedMessage,
) {
  applyChange(queryClient, chatId, id, { content: null, contentStatus: 'deleted', deletedAt });
}
