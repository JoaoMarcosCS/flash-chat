import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IUserRepository, UserProfile } from '../../repository/user-repository.interface';
import { UserEntity } from '../../entity/user.entity';
import { UpdateUserUseCase } from './update-user.usecase';
import { UpdateUserSchema } from './update-user.schema';
import { MessageError } from '@/shared/enums/erros.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { ILogger } from '@/infra/logger/logger.interface';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@/shared/errors/errors';
import { hash } from '@/shared/utils/hash';

const CURRENT_PASSWORD = '@Password123';

const userId = 'user-1';

const profile: UserProfile = {
  id: userId,
  name: 'John Doe',
  nickname: 'john.doe',
  email: 'john.doe@example.com',
};

let storedUser: UserEntity;

const mockRepository = (): IUserRepository => ({
  findBy: vi.fn().mockResolvedValue([]),
  findByEmailWithPassword: vi.fn(),
  findByIdWithPassword: vi.fn().mockResolvedValue(storedUser),
  findProfileById: vi.fn(),
  update: vi.fn().mockImplementation(async (_, data) => ({ ...profile, ...data })),
  create: vi.fn(),
});

const mockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnThis(),
});

describe('UpdateUserUseCase', () => {
  let repository: IUserRepository;
  let logger: ILogger;
  let useCase: UpdateUserUseCase;

  beforeAll(async () => {
    storedUser = { ...profile, password: await hash.generate(CURRENT_PASSWORD) } as UserEntity;
  });

  beforeEach(() => {
    repository = mockRepository();
    logger = mockLogger();
    useCase = new UpdateUserUseCase(repository, logger);
  });

  it('should update the given fields and return the profile', async () => {
    const result = await useCase.execute(
      { name: 'John Smith', currentPassword: CURRENT_PASSWORD },
      userId,
    );

    expect(result).toEqual({ ...profile, name: 'John Smith' });
    expect(repository.update).toHaveBeenCalledWith(userId, { name: 'John Smith' });
    expect(repository.findBy).not.toHaveBeenCalled();
  });

  it('should never log the passwords', async () => {
    await useCase.execute({ password: '@NewPass123', currentPassword: CURRENT_PASSWORD }, userId);

    const logged = JSON.stringify(vi.mocked(logger.info).mock.calls);

    expect(logged).not.toContain('@NewPass123');
    expect(logged).not.toContain(CURRENT_PASSWORD);
  });

  it('should throw UnauthorizedException when the user is not active', async () => {
    vi.mocked(repository.findByIdWithPassword).mockResolvedValueOnce(null);

    const promise = useCase.execute(
      { name: 'John Smith', currentPassword: CURRENT_PASSWORD },
      userId,
    );

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when the current password is wrong', async () => {
    const promise = useCase.execute({ name: 'John Smith', currentPassword: '@Wrong123' }, userId);

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_CURRENT_PASSWORD);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should check e-mail and nickname among active and deactivated users except the user', async () => {
    await useCase.execute(
      { email: 'new@example.com', nickname: 'new.nick', currentPassword: CURRENT_PASSWORD },
      userId,
    );

    expect(repository.findBy).toHaveBeenCalledWith({
      columns: { email: 'new@example.com' },
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
      excludeIds: [userId],
    });
    expect(repository.findBy).toHaveBeenCalledWith({
      columns: { nickname: 'new.nick' },
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
      excludeIds: [userId],
    });
  });

  it('should throw ConflictException when the e-mail is taken', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([
      { id: 'user-2', name: 'Jane', nickname: 'jane', status: UserStatus.DEACTIVATED },
    ]);

    const promise = useCase.execute(
      { email: 'jane@example.com', currentPassword: CURRENT_PASSWORD },
      userId,
    );

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(MessageError.EMAIL_ALREADY_EXISTS);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when the nickname is taken', async () => {
    vi.mocked(repository.findBy).mockResolvedValueOnce([
      { id: 'user-2', name: 'Jane', nickname: 'jane', status: UserStatus.ACTIVE },
    ]);

    const promise = useCase.execute(
      { nickname: 'jane', currentPassword: CURRENT_PASSWORD },
      userId,
    );

    await expect(promise).rejects.toThrow(MessageError.NICKNAME_ALREADY_EXISTS);
  });

  it('should save the new password hashed', async () => {
    await useCase.execute({ password: '@NewPass123', currentPassword: CURRENT_PASSWORD }, userId);

    const savedPassword = vi.mocked(repository.update).mock.calls[0][1].password ?? '';

    expect(savedPassword).not.toBe('@NewPass123');
    expect(await hash.compare('@NewPass123', savedPassword)).toBe(true);
  });
});

describe('UpdateUserSchema', () => {
  it('should require the current password', () => {
    const result = UpdateUserSchema.safeParse({ name: 'John Smith' });

    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Senha atual é obrigatória',
    );
  });

  it('should require at least one field to edit', () => {
    const result = UpdateUserSchema.safeParse({ currentPassword: CURRENT_PASSWORD });

    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Informe ao menos um campo para editar',
    );
  });

  it.each([
    [{ name: 'Al' }, 'Nome deve ter no mínimo 3 caracteres'],
    [{ nickname: 'john..doe' }, 'Nickname não pode ter "." consecutivos'],
    [{ email: 'invalid' }, 'E-mail inválido'],
    [{ password: 'abc' }, 'Senha deve ter no mínimo 6 caracteres'],
  ])('should apply the sign up rules to %j', (field, message) => {
    const result = UpdateUserSchema.safeParse({ ...field, currentPassword: CURRENT_PASSWORD });

    expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
  });

  it('should normalize the name like the sign up', () => {
    expect(
      UpdateUserSchema.parse({ name: '  Ana    Souza ', currentPassword: CURRENT_PASSWORD }).name,
    ).toBe('Ana Souza');
  });
});
