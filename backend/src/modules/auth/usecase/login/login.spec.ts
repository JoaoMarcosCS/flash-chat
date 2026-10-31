import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtPayload, verify } from 'jsonwebtoken';
import { IUserRepository } from '@/modules/users/repository/user-repository.interface';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { UserEntity } from '@/modules/users/entity/user.entity';
import { MessageError } from '@/shared/enums/erros.enum';
import { UnauthorizedException } from '@/shared/errors/errors';
import { env } from '@/shared/environment/env';
import { hash } from '@/shared/utils/hash';
import { verifyRefreshToken } from '../../token/token';
import { LoginUseCase } from './login.usecase';
import { LoginDTO, LoginSchema } from './login.schema';

const email = 'john.doe@example.com';

const mockLoginDTO: LoginDTO = { email, password: '@Password123' };

const user = {
  id: 'user-1',
  name: 'John Doe',
  nickname: 'john.doe',
  password: 'hashed',
} as UserEntity;

const mockRepository = (): IUserRepository => ({
  findBy: vi.fn(),
  findByEmailWithPassword: vi.fn().mockResolvedValue(user),
  create: vi.fn(),
});

const mockCache = (): ICacheProvider => ({
  get: vi.fn(),
  getAndDelete: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  invalidate: vi.fn(),
  invalidateByPrefix: vi.fn(),
  setLock: vi.fn(),
  releaseLock: vi.fn(),
  getWithLock: vi.fn(),
});

describe('LoginUseCase', () => {
  let repository: IUserRepository;
  let cache: ICacheProvider;
  let useCase: LoginUseCase;

  beforeEach(() => {
    vi.restoreAllMocks();
    repository = mockRepository();
    cache = mockCache();
    useCase = new LoginUseCase(repository, cache);
  });

  it('should throw UnauthorizedException when no active user matches the e-mail', async () => {
    vi.mocked(repository.findByEmailWithPassword).mockResolvedValueOnce(null);
    const compare = vi.spyOn(hash, 'compare');

    const promise = useCase.execute(mockLoginDTO);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_CREDENTIALS);
    expect(compare).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when the password does not match', async () => {
    vi.spyOn(hash, 'compare').mockResolvedValueOnce(false);

    const promise = useCase.execute(mockLoginDTO);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_CREDENTIALS);
  });

  it('should compare the given password with the stored hash', async () => {
    const compare = vi.spyOn(hash, 'compare').mockResolvedValueOnce(true);

    await useCase.execute(mockLoginDTO);

    expect(repository.findByEmailWithPassword).toHaveBeenCalledWith(email);
    expect(compare).toHaveBeenCalledWith(mockLoginDTO.password, user.password);
  });

  it('should return an access token with only sub, name and nickname', async () => {
    vi.spyOn(hash, 'compare').mockResolvedValueOnce(true);

    const { accessToken } = await useCase.execute(mockLoginDTO);
    const payload = verify(accessToken, env.JWT_SECRET) as JwtPayload;

    expect(payload).toMatchObject({ sub: user.id, name: user.name, nickname: user.nickname });
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'name', 'nickname', 'sub']);
  });

  it('should return a refresh token for the user', async () => {
    vi.spyOn(hash, 'compare').mockResolvedValueOnce(true);

    const { refreshToken, sessionId } = await useCase.execute(mockLoginDTO);

    expect(verifyRefreshToken(refreshToken)).toEqual({ userId: user.id, sessionId });
  });

  it('should save the session with the refresh token lifetime', async () => {
    vi.spyOn(hash, 'compare').mockResolvedValueOnce(true);

    const { sessionId } = await useCase.execute(mockLoginDTO);

    expect(cache.set).toHaveBeenCalledWith(`auth:refresh:${sessionId}`, user.id, 7 * 24 * 60 * 60);
  });
});

describe('LoginSchema', () => {
  it('should reject an invalid e-mail', () => {
    const result = LoginSchema.safeParse({ ...mockLoginDTO, email: 'invalid' });

    expect(result.error?.issues[0].message).toBe('E-mail inválido');
  });

  it('should reject an empty password', () => {
    const result = LoginSchema.safeParse({ email, password: '' });

    expect(result.error?.issues[0].message).toBe('Senha é obrigatória');
  });

  it('should reject password longer than 15 characters', () => {
    const result = LoginSchema.safeParse({ email, password: 'Abcdefgh1234@xyz' });

    expect(result.error?.issues[0].message).toBe('Senha deve ter no máximo 15 caracteres');
  });

  it('should accept password with exactly 15 characters', () => {
    expect(LoginSchema.safeParse({ email, password: 'Abcdefgh1234@xy' }).success).toBe(true);
  });
});
