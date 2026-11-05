import z from 'zod';
import { countSearchCharacters } from '@/shared/utils/build-ts-query';
import { ChatType } from '@/shared/enums/chats/chat-type.enum';

export const LIST_CHATS_DEFAULT_LIMIT = 20;

export const LIST_CHATS_SEARCH_MIN_LENGTH = 2;

export const ListChatsSchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .refine(
      (value) => value === '' || countSearchCharacters(value) >= LIST_CHATS_SEARCH_MIN_LENGTH,
      `Busca deve ter no mínimo ${LIST_CHATS_SEARCH_MIN_LENGTH} caracteres`,
    )
    .optional(),
  type: z.enum(ChatType, 'Tipo de Chat inválido').optional(),
  cursor: z.uuid('Cursor inválido').optional(),
  limit: z.coerce
    .number('Limite deve ser um número')
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite deve ser no mínimo 1')
    .max(100, 'Limite deve ser no máximo 100')
    .default(LIST_CHATS_DEFAULT_LIMIT),
});

export type ListChatsDTO = z.infer<typeof ListChatsSchema>;
