import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserData, IUserRepository, PublicUser } from '../../repository/IUserRepository';
import { CreateUserUseCase } from './create-user.usecase';
import { CreateUserDTO, CreateUserSchema } from './create-user.schema';
import { MessageError } from '@/shared/enums/erros.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { ILogger } from '@/infra/logger/ILogger';
import { ConflictException } from '@/shared/errors/errors';
import { hash } from '@/shared/utils/hash';

const mockCreateUserDTO: CreateUserDTO = {
  name: 'John Doe',
  nickname: 'john.doe',
  email: 'john.doe@example.com',
  password: '@Password123',
};

const existingUser = (overrides: Partial<PublicUser> = {}): PublicUser => ({
  id: '11111',
  name: mockCreateUserDTO.name,
  nickname: mockCreateUserDTO.nickname,
  status: UserStatus.ACTIVE,
  ...overrides,
});

const mockRepository = (): IUserRepository => ({
  findBy: vi.fn().mockResolvedValue([]),
  findByEmailWithPassword: vi.fn(),
  create: vi.fn().mockImplementation(async ({ name, nickname }: CreateUserData) => ({
    id: 'uuid-1',
    name,
    nickname,
    status: UserStatus.ACTIVE,
  })),
});

const mockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnThis(),
});

describe('CreateUserUseCase', () => {
  let repository: IUserRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repository = mockRepository();
    useCase = new CreateUserUseCase(repository, mockLogger());
  });

  it('should create a new user', async () => {
    const result = await useCase.execute(mockCreateUserDTO);

    expect(result).toEqual({
      id: 'uuid-1',
      name: mockCreateUserDTO.name,
      nickname: mockCreateUserDTO.nickname,
      status: UserStatus.ACTIVE,
    });
    expect(repository.findBy).toHaveBeenCalledTimes(2);
    expect(repository.findBy).toHaveBeenCalledWith({
      columns: { email: mockCreateUserDTO.email },
    });
    expect(repository.findBy).toHaveBeenCalledWith({
      columns: { nickname: mockCreateUserDTO.nickname },
    });
  });

  it('should throw ConflictException if email already exists', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([existingUser()]);

    const promise = useCase.execute(mockCreateUserDTO);

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(MessageError.EMAIL_ALREADY_EXISTS);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if nickname already exists', async () => {
    vi.mocked(repository.findBy)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([existingUser({ id: '22222' })]);

    const promise = useCase.execute(mockCreateUserDTO);

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(MessageError.NICKNAME_ALREADY_EXISTS);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should create user with hashed password', async () => {
    await useCase.execute(mockCreateUserDTO);

    const savedPassword = vi.mocked(repository.create).mock.calls[0][0].password;

    expect(savedPassword).not.toBe(mockCreateUserDTO.password);
    expect(await hash.compare(mockCreateUserDTO.password, savedPassword)).toBe(true);
  });

  it('should trim name and nickname', async () => {
    const result = CreateUserSchema.parse({
      ...mockCreateUserDTO,
      name: '  John Doe  ',
      nickname: ' john.doe ',
    });

    await useCase.execute(result);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John Doe', nickname: 'john.doe' }),
    );
  });

  it('should reject nickname with invalid characters', () => {
    expect(
      CreateUserSchema.safeParse({ ...mockCreateUserDTO, nickname: 'john doe!' }).success,
    ).toBe(false);
  });
});
