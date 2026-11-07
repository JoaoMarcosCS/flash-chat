import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IUserRepository, UserProfile } from '../../repository/user-repository.interface';
import { GetUserUseCase } from './get-user.usecase';
import { MessageError } from '@/shared/enums/erros.enum';
import { UnauthorizedException } from '@/shared/errors/errors';

const profile: UserProfile = {
  id: 'user-1',
  name: 'John Doe',
  nickname: 'john.doe',
  email: 'john.doe@example.com',
};

const mockRepository = (): IUserRepository => ({
  findBy: vi.fn(),
  findByEmailWithPassword: vi.fn(),
  findByIdWithPassword: vi.fn(),
  findProfileById: vi.fn().mockResolvedValue(profile),
  update: vi.fn(),
  create: vi.fn(),
});

describe('GetUserUseCase', () => {
  let repository: IUserRepository;
  let useCase: GetUserUseCase;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new GetUserUseCase(repository);
  });

  it('should return the profile of the user', async () => {
    expect(await useCase.execute(profile.id)).toEqual(profile);
    expect(repository.findProfileById).toHaveBeenCalledWith(profile.id);
  });

  it('should throw UnauthorizedException when the user is not active', async () => {
    vi.mocked(repository.findProfileById).mockResolvedValueOnce(null);

    const promise = useCase.execute(profile.id);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
  });
});
