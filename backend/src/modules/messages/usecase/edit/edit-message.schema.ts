import z from 'zod';
import { MessageContentSchema } from '../send/send-message.schema';

export const EditMessageSchema = z.object({
  chatId: z.uuid('Chat inválido'),
  id: z.uuid('Mensagem inválida'),
  content: MessageContentSchema,
});

export type EditMessageDTO = z.infer<typeof EditMessageSchema>;
