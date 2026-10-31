import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { container } from 'tsyringe';
import '@/infra/container/index';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { RedisCacheProvider } from '@/infra/cache/redis-cache.provider';
import { env } from '@/shared/environment/env';

Object.assign(env, {
  REDIS_HOST: inject('redisHost'),
  REDIS_PORT: inject('redisPort'),
});

const READY_TIMEOUT_MS = 5000;

const cache = () => container.resolve<ICacheProvider>('ICacheProvider');

beforeAll(async () => {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await cache().set('cache-setup:ready', true, 5);

    if (await cache().get('cache-setup:ready')) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Timed out waiting for Redis');
});

beforeEach(async () => {
  await cache().invalidateByPrefix('');
});

afterAll(async () => {
  await (cache() as RedisCacheProvider).disconnect();
});
