import z from 'zod';

export const LIST_MESSAGES_DEFAULT_LIMIT = 20;

export const ListMessagesSchema = z.object({
  chatId: z.uuid('Chat inválido'),
  cursor: z.uuid('Cursor inválido').optional(),
  limit: z.coerce
    .number('Limite deve ser um número')
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite deve ser no mínimo 1')
    .max(100, 'Limite deve ser no máximo 100')
    .default(LIST_MESSAGES_DEFAULT_LIMIT),
});

export type ListMessagesDTO = z.infer<typeof ListMessagesSchema>;
