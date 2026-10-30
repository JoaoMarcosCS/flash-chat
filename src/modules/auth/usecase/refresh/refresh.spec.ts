import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtPayload, verify } from 'jsonwebtoken';
import { IUserRepository, PublicUser } from '@/modules/users/repository/user-repository.interface';
import { MessageError } from '@/shared/enums/erros.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { UnauthorizedException } from '@/shared/errors/errors';
import { env } from '@/shared/environment/env';
import { generateTokens, verifyRefreshToken } from '../../token/token';
import { RefreshUseCase } from './refresh.usecase';
import { RefreshSchema } from './refresh.schema';

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

describe('RefreshUseCase', () => {
  let repository: IUserRepository;
  let useCase: RefreshUseCase;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new RefreshUseCase(repository);
  });

  it('should throw UnauthorizedException for a malformed token', async () => {
    const promise = useCase.execute({ refreshToken: 'invalid' });

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(repository.findBy).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when an access token is used as refresh token', async () => {
    const { accessToken } = generateTokens(user);

    const promise = useCase.execute({ refreshToken: accessToken });

    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(repository.findBy).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when no active user matches the token', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([]);
    const { refreshToken } = generateTokens(user);

    const promise = useCase.execute({ refreshToken });

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
  });

  it('should look up only active users by the token subject', async () => {
    const { refreshToken } = generateTokens(user);

    await useCase.execute({ refreshToken });

    expect(repository.findBy).toHaveBeenCalledWith({ ids: [user.id] });
  });

  it('should return a new pair of tokens for the user', async () => {
    const { refreshToken } = generateTokens(user);

    const tokens = await useCase.execute({ refreshToken });
    const payload = verify(tokens.accessToken, env.JWT_SECRET) as JwtPayload;

    expect(payload).toMatchObject({ sub: user.id, name: user.name, nickname: user.nickname });
    expect(verifyRefreshToken(tokens.refreshToken)).toBe(user.id);
  });
});

describe('RefreshSchema', () => {
  it('should reject an empty refresh token', () => {
    const result = RefreshSchema.safeParse({ refreshToken: '' });

    expect(result.error?.issues[0].message).toBe('Refresh token é obrigatório');
  });
});
