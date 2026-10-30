import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { generateTokens } from '../../token/token';
import { LogoutUseCase } from './logout.usecase';

const user = { id: 'user-1', name: 'John Doe', nickname: 'john.doe' };

const mockCache = (): ICacheProvider => ({
  get: vi.fn(),
  getAndDelete: vi.fn(),
  set: vi.fn(),
  invalidate: vi.fn().mockResolvedValue(undefined),
  invalidateByPrefix: vi.fn(),
  setLock: vi.fn(),
  releaseLock: vi.fn(),
  getWithLock: vi.fn(),
});

describe('LogoutUseCase', () => {
  let cache: ICacheProvider;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    cache = mockCache();
    useCase = new LogoutUseCase(cache);
  });

  it('should revoke the session of the refresh token', async () => {
    const { refreshToken, sessionId } = generateTokens(user);

    await useCase.execute({ refreshToken });

    expect(cache.invalidate).toHaveBeenCalledWith(`auth:refresh:${sessionId}`);
  });

  it.each([
    ['a missing token', undefined],
    ['a malformed token', 'invalid'],
    ['an access token', generateTokens(user).accessToken],
  ])('should do nothing for %s', async (_, refreshToken) => {
    await expect(useCase.execute({ refreshToken })).resolves.toBeUndefined();

    expect(cache.invalidate).not.toHaveBeenCalled();
  });
});
