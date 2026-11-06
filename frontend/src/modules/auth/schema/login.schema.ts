import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .max(15, 'Senha deve ter no máximo 15 caracteres'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;
