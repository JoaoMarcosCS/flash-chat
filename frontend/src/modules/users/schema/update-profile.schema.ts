import { z } from 'zod';
import { RegisterSchema } from '@/modules/auth/schema/register.schema';

export const UpdateProfileSchema = RegisterSchema.extend({
  password: RegisterSchema.shape.password.or(z.literal('')),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

export const CurrentPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
});

export type CurrentPasswordDTO = z.infer<typeof CurrentPasswordSchema>;
