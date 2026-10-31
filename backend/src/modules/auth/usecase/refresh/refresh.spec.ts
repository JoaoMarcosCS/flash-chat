import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtPayload, verify } from 'jsonwebtoken';
import { IUserRepository, PublicUser } from '@/modules/users/repository/user-repository.interface';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { MessageError } from '@/shared/enums/erros.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { UnauthorizedException } from '@/shared/errors/errors';
import { env } from '@/shared/environment/env';
import { generateTokens, verifyRefreshToken } from '../../token/token';
import { RefreshUseCase } from './refresh.usecase';

const user: PublicUser = {
  id: 'user-1',
  name: 'John Doe',
  nickname: 'john.doe',
  status: UserStatus.ACTIVE,
};

const mockRepository = (): IUserRepository => ({
  findBy: vi.fn().mockResolvedValue([user]),
  findByEmailWithPassword: vi.fn(),
  create: vi.fn(),
});

const mockCache = (): ICacheProvider => ({
  get: vi.fn(),
  getAndDelete: vi.fn().mockResolvedValue(user.id),
  set: vi.fn().mockResolvedValue(undefined),
  invalidate: vi.fn(),
  invalidateByPrefix: vi.fn(),
  setLock: vi.fn(),
  releaseLock: vi.fn(),
  getWithLock: vi.fn(),
});

describe('RefreshUseCase', () => {
  let repository: IUserRepository;
  let cache: ICacheProvider;
  let useCase: RefreshUseCase;

  beforeEach(() => {
    repository = mockRepository();
    cache = mockCache();
    useCase = new RefreshUseCase(repository, cache);
  });

  it.each([
    ['a missing token', undefined],
    ['a malformed token', 'invalid'],
    ['an access token', generateTokens(user).accessToken],
  ])('should throw UnauthorizedException for %s', async (_, refreshToken) => {
    const promise = useCase.execute({ refreshToken });

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(cache.getAndDelete).not.toHaveBeenCalled();
  });

  it('should consume the session of the token', async () => {
    const { refreshToken, sessionId } = generateTokens(user);

    await useCase.execute({ refreshToken });

    expect(cache.getAndDelete).toHaveBeenCalledWith(`auth:refresh:${sessionId}`);
  });

  it('should throw UnauthorizedException when the session was already used or revoked', async () => {
    vi.mocked(cache.getAndDelete).mockResolvedValueOnce(null);

    const promise = useCase.execute({ refreshToken: generateTokens(user).refreshToken });

    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(repository.findBy).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when the session belongs to another user', async () => {
    vi.mocked(cache.getAndDelete).mockResolvedValueOnce('user-2');

    const promise = useCase.execute({ refreshToken: generateTokens(user).refreshToken });

    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
  });

  it('should throw UnauthorizedException when no active user matches the token', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([]);

    const promise = useCase.execute({ refreshToken: generateTokens(user).refreshToken });

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('should look up only active users by the token subject', async () => {
    await useCase.execute({ refreshToken: generateTokens(user).refreshToken });

    expect(repository.findBy).toHaveBeenCalledWith({ ids: [user.id] });
  });

  it('should return a new pair of tokens and save the new session', async () => {
    const previous = generateTokens(user);

    const tokens = await useCase.execute({ refreshToken: previous.refreshToken });
    const payload = verify(tokens.accessToken, env.JWT_SECRET) as JwtPayload;

    expect(payload).toMatchObject({ sub: user.id, name: user.name, nickname: user.nickname });
    expect(verifyRefreshToken(tokens.refreshToken)).toEqual({
      userId: user.id,
      sessionId: tokens.sessionId,
    });
    expect(tokens.sessionId).not.toBe(previous.sessionId);
    expect(cache.set).toHaveBeenCalledWith(
      `auth:refresh:${tokens.sessionId}`,
      user.id,
      expect.any(Number),
    );
  });
});
