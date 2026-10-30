import { describe, expect, it } from 'vitest';
import { container } from 'tsyringe';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';

describe('RedisCacheProvider (integração)', () => {
  const cache = () => container.resolve<ICacheProvider>('ICacheProvider');

  it('should return the value and delete the key', async () => {
    await cache().set('session', { userId: 'ana' }, 60);

    expect(await cache().getAndDelete('session')).toEqual({ userId: 'ana' });
    expect(await cache().get('session')).toBeNull();
  });

  it('should return null for a missing key', async () => {
    expect(await cache().getAndDelete('missing')).toBeNull();
  });

  it('should return the value to only one of two concurrent calls', async () => {
    await cache().set('session', 'ana', 60);

    const results = await Promise.all([
      cache().getAndDelete('session'),
      cache().getAndDelete('session'),
    ]);

    expect(results.filter((value) => value !== null)).toEqual(['ana']);
  });
});
