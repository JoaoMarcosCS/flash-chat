import z from 'zod';

export const GetChatSchema = z.object({
  id: z.uuid('Chat inválido'),
});

export type GetChatDTO = z.infer<typeof GetChatSchema>;
