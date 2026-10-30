import z from 'zod';

export const RefreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RefreshDTO = z.infer<typeof RefreshSchema>;
