import { ZodSchema } from 'zod';
import { BadRequestException } from '../errors/errors';

export function validateWithZod<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];

    throw new BadRequestException(firstError.message);
  }

  return result.data;
}
