import z from 'zod';
import { hasEmoji } from '@/shared/utils/has-special-characters';

export const CreateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .refine((value) => !hasEmoji(value), 'Nome não pode conter emojis')
    .refine(
      (value) => /^[A-Za-zÀ-ÿ\s]+$/.test(value),
      'Nome deve conter apenas letras, espaços e acentos',
    ),
  nickname: z
    .string()
    .trim()
    .min(3, 'Nickname deve ter no mínimo 3 caracteres')
    .max(50, 'Nickname deve ter no máximo 50 caracteres')
    .regex(/^[A-Za-z0-9_.]+$/, 'Nickname deve conter apenas letras, números, "_" e "."')
    .regex(/^[A-Za-z0-9]/, 'Nickname deve começar com uma letra ou um número')
    .refine((value) => !value.endsWith('.'), 'Nickname não pode terminar com "."')
    .refine((value) => !value.includes('..'), 'Nickname não pode ter "." consecutivos'),
  email: z
    .email('E-mail inválido')
    .max(255, 'E-mail deve ter no máximo 255 caracteres')
    .refine((value) => !hasEmoji(value), 'E-mail não pode conter emojis'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(15, 'Senha deve ter no máximo 15 caracteres')
    .refine((value) => !hasEmoji(value), 'Senha não pode conter emojis')
    .refine((value) => /[A-Z]/.test(value), 'Senha deve conter ao menos uma letra maiúscula')
    .refine((value) => /[a-z]/.test(value), 'Senha deve conter ao menos uma letra minúscula')
    .refine((value) => /[0-9]/.test(value), 'Senha deve conter ao menos um número')
    .refine(
      (value) => /[^A-Za-z0-9]/.test(value),
      'Senha deve conter ao menos um símbolo como @, #, &',
    ),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
