import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IUserRepository } from '../../repository/user-repository.interface';
import { UserEntity } from '../../entity/user.entity';
import { DeactivateUserUseCase } from './deactivate-user.usecase';
import { DeactivateUserSchema } from './deactivate-user.schema';
import { IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { BadRequestException, UnauthorizedException } from '@/shared/errors/errors';
import { hash } from '@/shared/utils/hash';

const CURRENT_PASSWORD = '@Password123';

const userId = 'user-1';

let storedUser: UserEntity;

const mockUserRepository = (): IUserRepository => ({
  findBy: vi.fn(),
  findByEmailWithPassword: vi.fn(),
  findByIdWithPassword: vi.fn().mockResolvedValue(storedUser),
  findProfileById: vi.fn(),
  update: vi.fn().mockResolvedValue(undefined),
  create: vi.fn(),
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn(),
  findDirectChat: vi.fn(),
  createGroup: vi.fn(),
  findById: vi.fn(),
  findByParticipant: vi.fn(),
  enrichWithParticipants: vi.fn(),
  findCoParticipantIds: vi.fn().mockResolvedValue(['user-2', 'user-3']),
});

const mockQueueProvider = (): IQueueProvider => ({
  publish: vi.fn(),
  publishExchange: vi.fn().mockResolvedValue(undefined),
  consume: vi.fn(),
  consumeExchange: vi.fn(),
  close: vi.fn(),
});

const mockLogger = (): ILogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnThis(),
});

describe('DeactivateUserUseCase', () => {
  let userRepository: IUserRepository;
  let chatRepository: IChatRepository;
  let queue: IQueueProvider;
  let logger: ILogger;
  let useCase: DeactivateUserUseCase;

  beforeAll(async () => {
    storedUser = {
      id: userId,
      name: 'John Doe',
      nickname: 'john.doe',
      email: 'john.doe@example.com',
      password: await hash.generate(CURRENT_PASSWORD),
    } as UserEntity;
  });

  beforeEach(() => {
    userRepository = mockUserRepository();
    chatRepository = mockChatRepository();
    queue = mockQueueProvider();
    logger = mockLogger();
    useCase = new DeactivateUserUseCase(userRepository, chatRepository, queue, logger);
  });

  it('should deactivate the user', async () => {
    await useCase.execute({ currentPassword: CURRENT_PASSWORD }, userId);

    expect(userRepository.update).toHaveBeenCalledWith(userId, {
      status: UserStatus.DEACTIVATED,
    });
  });

  it('should publish user.deactivated to the co-participants', async () => {
    await useCase.execute({ currentPassword: CURRENT_PASSWORD }, userId);

    expect(chatRepository.findCoParticipantIds).toHaveBeenCalledWith(userId);
    expect(queue.publishExchange).toHaveBeenCalledWith(
      Exchange.EVENTS,
      RoutingKey.USER_DEACTIVATED,
      { participantIds: ['user-2', 'user-3'], user: { id: userId } },
    );
  });

  it('should keep the deactivation when the publication fails', async () => {
    vi.mocked(queue.publishExchange).mockRejectedValueOnce(new Error('broker down'));

    await expect(
      useCase.execute({ currentPassword: CURRENT_PASSWORD }, userId),
    ).resolves.toBeUndefined();
    expect(userRepository.update).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when the user is not active', async () => {
    vi.mocked(userRepository.findByIdWithPassword).mockResolvedValueOnce(null);

    const promise = useCase.execute({ currentPassword: CURRENT_PASSWORD }, userId);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when the current password is wrong', async () => {
    const promise = useCase.execute({ currentPassword: '@Wrong123' }, userId);

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_CURRENT_PASSWORD);
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });

  it('should require the current password', () => {
    const result = DeactivateUserSchema.safeParse({});

    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      'Senha atual é obrigatória',
    );
  });
});
