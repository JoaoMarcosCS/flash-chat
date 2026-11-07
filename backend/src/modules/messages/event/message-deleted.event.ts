export type MessageDeletedEvent = {
  participantIds: string[];
  message: {
    id: string;
    chatId: string;
    deletedAt: Date;
  };
};
