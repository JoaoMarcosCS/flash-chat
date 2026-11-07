export type MessageEditedEvent = {
  participantIds: string[];
  message: {
    id: string;
    chatId: string;
    content: string;
    editedAt: Date;
  };
};
