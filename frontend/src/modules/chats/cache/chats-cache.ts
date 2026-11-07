import type { QueryClient } from '@tanstack/react-query';
import { getChatType, toChatListItem } from '../display/chat-display';
import type { Chat, ChatListItem, ChatType, LastMessage } from '../interface/chat.interface';
import { findChatRequest } from '../service/find-chat.request';
import type { InfinitePages } from '@/lib/paginated';

export const chatsQueryKey = (type: ChatType, search: string) => ['chats', type, search] as const;

export const chatQueryKey = (chatId: string) => ['chat', chatId] as const;

const CHAT_TYPES: ChatType[] = ['direct', 'group'];

const LAST_MESSAGE_PREVIEW_LENGTH = 100;

function findListItem(queryClient: QueryClient, chatId: string): ChatListItem | undefined {
  return CHAT_TYPES.flatMap(
    (type) =>
      queryClient
        .getQueryData<InfinitePages<ChatListItem>>(chatsQueryKey(type, ''))
        ?.pages.flatMap((page) => page.data) ?? [],
  ).find((chat) => chat.id === chatId);
}

function invalidateSearches(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: ['chats'],
    predicate: (query) => query.queryKey[2] !== '',
  });
}

function moveToTop(queryClient: QueryClient, item: ChatListItem) {
  const queryKey = chatsQueryKey(getChatType(item), '');
  queryClient.setQueryData<InfinitePages<ChatListItem>>(queryKey, (data) => {
    if (!data) return data;
    const pages = data.pages.map((page) => ({
      ...page,
      data: page.data.filter((chat) => chat.id !== item.id),
    }));
    pages[0] = { ...pages[0], data: [item, ...pages[0].data] };
    return { ...data, pages };
  });
}

export function addCreatedChat(queryClient: QueryClient, chat: Chat, userId: string) {
  queryClient.setQueryData(chatQueryKey(chat.id), chat);
  if (!findListItem(queryClient, chat.id)) moveToTop(queryClient, toChatListItem(chat, userId));
  invalidateSearches(queryClient);
}

export async function applyLastMessage(
  queryClient: QueryClient,
  chatId: string,
  lastMessage: LastMessage,
  userId: string,
) {
  const preview = {
    ...lastMessage,
    content: lastMessage.content?.slice(0, LAST_MESSAGE_PREVIEW_LENGTH) ?? null,
  };
  const current = findListItem(queryClient, chatId);

  if (current?.lastMessage && current.lastMessage.id >= lastMessage.id) return;

  if (current) {
    moveToTop(queryClient, { ...current, lastMessage: preview });
  } else {
    const chat = await queryClient.fetchQuery({
      queryKey: chatQueryKey(chatId),
      queryFn: () => findChatRequest(chatId),
    });
    moveToTop(queryClient, toChatListItem(chat, userId, preview));
  }

  invalidateSearches(queryClient);
}

export function applyLastMessageContent(
  queryClient: QueryClient,
  chatId: string,
  messageId: string,
  content: string | null,
) {
  queryClient.setQueriesData<InfinitePages<ChatListItem>>({ queryKey: ['chats'] }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: page.data.map((chat) =>
          chat.id === chatId && chat.lastMessage?.id === messageId
            ? {
                ...chat,
                lastMessage: {
                  ...chat.lastMessage,
                  content: content?.slice(0, LAST_MESSAGE_PREVIEW_LENGTH) ?? null,
                },
              }
            : chat,
        ),
      })),
    };
  });
}

export function markChatReadOnly(queryClient: QueryClient, chatId: string) {
  queryClient.setQueryData<Chat>(
    chatQueryKey(chatId),
    (chat) => chat && { ...chat, readOnly: true },
  );
  queryClient.setQueriesData<InfinitePages<ChatListItem>>({ queryKey: ['chats'] }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        data: page.data.map((chat) => (chat.id === chatId ? { ...chat, readOnly: true } : chat)),
      })),
    };
  });
}

export function applyUserDeactivated(queryClient: QueryClient, userId: string) {
  queryClient.getQueriesData<Chat>({ queryKey: ['chat'] }).forEach(([, chat]) => {
    if (chat && !chat.isGroup && chat.participants.some(({ id }) => id === userId)) {
      markChatReadOnly(queryClient, chat.id);
    }
  });
  void queryClient.invalidateQueries({ queryKey: ['chats', 'direct'] });
}
