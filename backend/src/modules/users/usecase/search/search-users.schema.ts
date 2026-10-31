import z from 'zod';
import { countSearchCharacters } from '@/shared/utils/build-ts-query';

export const SEARCH_USERS_DEFAULT_LIMIT = 20;

export const SEARCH_USERS_MIN_LENGTH = 2;

export const SearchUsersSchema = z.object({
  search: z
    .string('Busca é obrigatória')
    .trim()
    .max(100, 'Busca deve ter no máximo 100 caracteres')
    .refine(
      (value) => countSearchCharacters(value) >= SEARCH_USERS_MIN_LENGTH,
      `Busca deve ter no mínimo ${SEARCH_USERS_MIN_LENGTH} caracteres`,
    ),
  cursor: z.uuid('Cursor inválido').optional(),
  limit: z.coerce
    .number('Limite deve ser um número')
    .int('Limite deve ser um número inteiro')
    .min(1, 'Limite deve ser no mínimo 1')
    .max(100, 'Limite deve ser no máximo 100')
    .default(SEARCH_USERS_DEFAULT_LIMIT),
});

export type SearchUsersDTO = z.infer<typeof SearchUsersSchema>;
