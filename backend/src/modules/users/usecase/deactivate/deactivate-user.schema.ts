import z from 'zod';
import { CurrentPasswordSchema } from '../update/update-user.schema';

export const DeactivateUserSchema = z.object({
  currentPassword: CurrentPasswordSchema,
});

export type DeactivateUserDTO = z.infer<typeof DeactivateUserSchema>;
