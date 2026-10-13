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
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
    });
    expect(repository.findBy).toHaveBeenCalledWith({
      columns: { nickname: mockCreateUserDTO.nickname },
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
    });
  });

  it('should throw ConflictException if email already exists', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([existingUser()]);

    const promise = useCase.execute(mockCreateUserDTO);

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(MessageError.EMAIL_ALREADY_EXISTS);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if email belongs to a deactivated user', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([
      existingUser({ status: UserStatus.DEACTIVATED }),
    ]);

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

  it('should reject password longer than 15 characters', () => {
    const result = CreateUserSchema.safeParse({
      ...mockCreateUserDTO,
      password: 'Abcdefgh1234@xyz',
    });

    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Senha deve ter no máximo 15 caracteres',
    );
  });

  it('should accept password with exactly 15 characters', () => {
    expect(
      CreateUserSchema.safeParse({ ...mockCreateUserDTO, password: 'Abcdefgh1234@xy' }).success,
    ).toBe(true);
  });

  it('should reject nickname with invalid characters', () => {
    expect(
      CreateUserSchema.safeParse({ ...mockCreateUserDTO, nickname: 'john doe!' }).success,
    ).toBe(false);
  });

  it.each([
    ['.john', 'Nickname deve começar com uma letra ou um número'],
    ['_john', 'Nickname deve começar com uma letra ou um número'],
    ['john.', 'Nickname não pode terminar com "."'],
    ['john..doe', 'Nickname não pode ter "." consecutivos'],
  ])('should reject nickname %s', (nickname, message) => {
    const result = CreateUserSchema.safeParse({ ...mockCreateUserDTO, nickname });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
  });

  it.each(['john.doe', 'john_doe', 'john_', '1john', 'j.o.h.n'])(
    'should accept nickname %s',
    (nickname) => {
      expect(CreateUserSchema.safeParse({ ...mockCreateUserDTO, nickname }).success).toBe(true);
    },
  );
});
