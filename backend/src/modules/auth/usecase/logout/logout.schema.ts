import z from 'zod';

export const LogoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LogoutDTO = z.infer<typeof LogoutSchema>;
