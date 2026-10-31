import { z } from 'zod';

export const ErrorSchema = z
  .object({
    error: z.object({
      type: z.string(),
      message: z.string(),
    }),
  })
  .meta({ id: 'Error' });

export const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: ErrorSchema } },
});
