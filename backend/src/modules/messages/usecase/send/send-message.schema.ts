import z from 'zod';

export const MESSAGE_CONTENT_MAX_LENGTH = 1000;

export const MessageContentSchema = z
  .string('Mensagem é obrigatória')
  .trim()
  .min(1, 'Mensagem é obrigatória')
  .max(
    MESSAGE_CONTENT_MAX_LENGTH,
    `Mensagem deve ter no máximo ${MESSAGE_CONTENT_MAX_LENGTH} caracteres`,
  );

export const SendMessageSchema = z.object({
  id: z.uuid('Chat inválido'),
  content: MessageContentSchema,
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;
