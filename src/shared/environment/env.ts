import { z } from 'zod';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({
  path: join(__dirname, '../../../.env'),
});

const envSchema = z.object({
  API_PORT: z.preprocess((val) => Number(val), z.number()),
  WS_PORT: z.coerce.number().default(3001),
  NODE_VERSION: z.string(),
  ENVIRONMENT: z.enum(['development', 'production', 'test', 'local']),
  DB_HOST: z.string(),
  DB_PORT: z.preprocess((val) => Number(val), z.number()),
  DB_USER: z.string(),
  DB_PASS: z.string(),
  DB_NAME: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.preprocess((val) => Number(val), z.number()),
  RABBITMQ_HOST: z.string(),
  RABBITMQ_PORT: z.preprocess((val) => Number(val), z.number()),
  RABBITMQ_USER: z.string(),
  RABBITMQ_PASS: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export const env = envSchema.parse(process.env) as z.infer<typeof envSchema>;
