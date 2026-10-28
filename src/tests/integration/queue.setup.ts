import { inject } from 'vitest';
import { env } from '@/shared/environment/env';

Object.assign(env, {
  RABBITMQ_HOST: inject('rabbitmqHost'),
  RABBITMQ_PORT: inject('rabbitmqPort'),
  RABBITMQ_USER: 'guest',
  RABBITMQ_PASS: 'guest',
});
