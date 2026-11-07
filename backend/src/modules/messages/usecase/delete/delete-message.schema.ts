import z from 'zod';

export const DeleteMessageSchema = z.object({
  chatId: z.uuid('Chat inválido'),
  id: z.uuid('Mensagem inválida'),
});

export type DeleteMessageDTO = z.infer<typeof DeleteMessageSchema>;
