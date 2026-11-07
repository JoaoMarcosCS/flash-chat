import z from 'zod';
import { CreateUserSchema } from '../create/create-user.schema';

export const CurrentPasswordSchema = z
  .string('Senha atual é obrigatória')
  .min(1, 'Senha atual é obrigatória');

export const UpdateUserSchema = CreateUserSchema.partial()
  .extend({ currentPassword: CurrentPasswordSchema })
  .refine(
    ({ name, nickname, email, password }) =>
      [name, nickname, email, password].some((value) => value !== undefined),
    'Informe ao menos um campo para editar',
  );

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
