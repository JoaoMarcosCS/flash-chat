import z from 'zod';

export const MessagePublishedSchema = z.object({
  participantIds: z.array(z.uuid()),
  message: z.object({
    id: z.uuid(),
    chatId: z.uuid(),
    content: z.string().min(1).max(1000),
    createdAt: z.coerce.date(),
    sender: z.object({ id: z.uuid(), name: z.string() }),
  }),
});

export type MessagePublishedEvent = z.infer<typeof MessagePublishedSchema>;
