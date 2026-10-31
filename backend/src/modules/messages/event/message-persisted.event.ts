export type MessagePersistedEvent = {
  participantIds: string[];
  message: {
    id: string;
    chatId: string;
  };
};
