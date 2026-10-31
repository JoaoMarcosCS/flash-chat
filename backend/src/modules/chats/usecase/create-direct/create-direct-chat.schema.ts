import z from 'zod';

export const CreateDirectChatSchema = z.object({
  participantId: z.uuid('Participant inválido').overwrite((value) => value.toLowerCase()),
});

export type CreateDirectChatDTO = z.infer<typeof CreateDirectChatSchema>;
