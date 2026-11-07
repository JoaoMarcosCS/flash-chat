import { create } from 'zustand';
import type {
  ChatMessage,
  MessageChange,
  MessageStatus,
  PublishedMessage,
} from '../interface/message.interface';

interface LiveMessagesStore {
  byChat: Record<string, ChatMessage[]>;
  persistedIds: Record<string, true>;
  addPending: (chatId: string, message: ChatMessage) => void;
  receive: (message: PublishedMessage) => void;
  markPublished: (
    chatId: string,
    clientId: string,
    published: { id: string; createdAt: string },
  ) => void;
  markPersisted: (id: string) => void;
  setStatus: (chatId: string, clientId: string, status: MessageStatus) => void;
  applyChange: (chatId: string, id: string, change: MessageChange) => void;
  remove: (chatId: string, clientId: string) => void;
  clear: () => void;
}

export const useLiveMessagesStore = create<LiveMessagesStore>()((set) => ({
  byChat: {},
  persistedIds: {},

  addPending: (chatId, message) =>
    set((state) => ({
      byChat: { ...state.byChat, [chatId]: [...(state.byChat[chatId] ?? []), message] },
    })),

  receive: ({ chatId, ...message }) =>
    set((state) => {
      const messages = state.byChat[chatId] ?? [];
      if (messages.some((current) => current.id === message.id)) return state;
      return { byChat: { ...state.byChat, [chatId]: [...messages, message] } };
    }),

  markPublished: (chatId, clientId, { id, createdAt }) =>
    set((state) => {
      const messages = state.byChat[chatId] ?? [];
      const status: MessageStatus = state.persistedIds[id] ? 'persisted' : 'published';
      const delivered = messages.some((message) => message.id === id);

      const next = delivered
        ? messages
            .filter((message) => message.clientId !== clientId)
            .map((message) => (message.id === id ? { ...message, clientId, status } : message))
        : messages.map((message) =>
            message.clientId === clientId ? { ...message, id, createdAt, status } : message,
          );

      return { byChat: { ...state.byChat, [chatId]: next } };
    }),

  markPersisted: (id) =>
    set((state) => ({
      persistedIds: { ...state.persistedIds, [id]: true },
      byChat: Object.fromEntries(
        Object.entries(state.byChat).map(([chatId, messages]) => [
          chatId,
          messages.map((message) =>
            message.id === id && message.status ? { ...message, status: 'persisted' } : message,
          ),
        ]),
      ),
    })),

  setStatus: (chatId, clientId, status) =>
    set((state) => ({
      byChat: {
        ...state.byChat,
        [chatId]: (state.byChat[chatId] ?? []).map((message) =>
          message.clientId === clientId ? { ...message, status } : message,
        ),
      },
    })),

  applyChange: (chatId, id, change) =>
    set((state) => ({
      byChat: {
        ...state.byChat,
        [chatId]: (state.byChat[chatId] ?? []).map((message) =>
          message.id === id ? { ...message, ...change } : message,
        ),
      },
    })),

  remove: (chatId, clientId) =>
    set((state) => ({
      byChat: {
        ...state.byChat,
        [chatId]: (state.byChat[chatId] ?? []).filter((message) => message.clientId !== clientId),
      },
    })),

  clear: () => set({ byChat: {}, persistedIds: {} }),
}));
