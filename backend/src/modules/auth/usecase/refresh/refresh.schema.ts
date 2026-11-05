import z from 'zod';

export const RefreshSchema = z.object({
  refreshToken: z.string('Refresh token é obrigatório').nonempty('Refresh token é obrigatório'),
});

export type RefreshDTO = z.infer<typeof RefreshSchema>;
