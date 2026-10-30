import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatDetails, IChatRepository } from '../../repository/chat-repository.interface';
import { CreateDirectChatUseCase } from './create-direct-chat.usecase';
import { CreateDirectChatSchema } from './create-direct-chat.schema';
import { IUserRepository, PublicUser } from '@/modules/users/repository/user-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/shared/errors/errors';

const userId = '0199b7a0-0000-7000-8000-000000000001';
const participantId = '0199b7a0-0000-7000-8000-000000000002';

const makeUser = (id: string, status = UserStatus.ACTIVE): PublicUser => ({
  id,
  name: id === userId ? 'Ana Souza' : 'Bruno Lima',
  nickname: id === userId ? 'ana' : 'bruno',
  status,
});

const makeChat = (participantStatus = UserStatus.ACTIVE): ChatDetails => ({
  id: '0199b7a0-0000-7000-8000-0000000000aa',
  isGroup: false,
  title: null,
  createdBy: userId,
  createdAt: new Date('2026-10-27T12:00:00Z'),
  participants: [makeUser(userId), makeUser(participantId, participantStatus)],
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn().mockResolvedValue({ chat: makeChat(), created: true }),
  findDirectChat: vi.fn().mockResolvedValue(null),
  createGroup: vi.fn(),
  findById: vi.fn(),
  findByParticipant: vi.fn(),
});

const mockUserRepository = (): IUserRepository => ({
  findBy: vi.fn().mockResolvedValue([makeUser(userId), makeUser(participantId)]),
  findByEmailWithPassword: vi.fn(),
  create: vi.fn(),
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

describe('CreateDirectChatUseCase', () => {
  let chatRepository: IChatRepository;
  let userRepository: IUserRepository;
  let useCase: CreateDirectChatUseCase;
  let logger: ILogger;
  let queue: IQueueProvider;

  beforeEach(() => {
    chatRepository = mockChatRepository();
    userRepository = mockUserRepository();
    logger = mockLogger();
    queue = mockQueueProvider();
    useCase = new CreateDirectChatUseCase(chatRepository, userRepository, queue, logger);
  });

  it('should create a direct chat and hide participant status', async () => {
    const result = await useCase.execute({ participantId }, userId);

    expect(userRepository.findBy).toHaveBeenCalledWith({
      ids: [userId, participantId],
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
    });
    expect(chatRepository.createDirectChat).toHaveBeenCalledWith({
      initiatorId: userId,
      participantId,
    });
    expect(result).toEqual({
      created: true,
      chat: {
        id: '0199b7a0-0000-7000-8000-0000000000aa',
        isGroup: false,
        title: null,
        createdBy: userId,
        createdAt: new Date('2026-10-27T12:00:00Z'),
        readOnly: false,
        participants: [
          { id: userId, name: 'Ana Souza', nickname: 'ana' },
          { id: participantId, name: 'Bruno Lima', nickname: 'bruno' },
        ],
      },
    });
  });

  it('should publish chat.created to all participants when the chat is created', async () => {
    const { chat } = await useCase.execute({ participantId }, userId);

    expect(queue.publishExchange).toHaveBeenCalledWith(Exchange.EVENTS, RoutingKey.CHAT_CREATED, {
      participantIds: [userId, participantId],
      chat,
    });
  });

  it('should still return the chat when publishing chat.created fails', async () => {
    vi.mocked(queue.publishExchange).mockRejectedValueOnce(new Error('broker down'));

    const result = await useCase.execute({ participantId }, userId);

    expect(result.created).toBe(true);
    expect(logger.error).toHaveBeenCalledWith('Failed to publish chat.created', expect.anything());
  });

  it('should return created false when the direct chat already exists', async () => {
    vi.mocked(chatRepository.createDirectChat).mockResolvedValueOnce({
      chat: makeChat(),
      created: false,
    });

    const result = await useCase.execute({ participantId }, userId);

    expect(result.created).toBe(false);
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });

  it('should reject the user as its own participant', async () => {
    const promise = useCase.execute({ participantId: userId }, userId);

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);
    await expect(promise).rejects.toThrow(MessageError.CANNOT_INCLUDE_YOURSELF);
    expect(userRepository.findBy).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when the initiator is deactivated', async () => {
    vi.mocked(userRepository.findBy).mockResolvedValueOnce([
      makeUser(userId, UserStatus.DEACTIVATED),
      makeUser(participantId),
    ]);

    const promise = useCase.execute({ participantId }, userId);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(chatRepository.createDirectChat).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when the participant does not exist', async () => {
    vi.mocked(userRepository.findBy).mockResolvedValueOnce([makeUser(userId)]);

    const promise = useCase.execute({ participantId }, userId);

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.USER_NOT_FOUND);
  });

  it('should return the existing read-only chat when the participant is deactivated', async () => {
    vi.mocked(userRepository.findBy).mockResolvedValueOnce([
      makeUser(userId),
      makeUser(participantId, UserStatus.DEACTIVATED),
    ]);
    vi.mocked(chatRepository.findDirectChat).mockResolvedValueOnce(
      makeChat(UserStatus.DEACTIVATED),
    );

    const result = await useCase.execute({ participantId }, userId);

    expect(chatRepository.findDirectChat).toHaveBeenCalledWith([userId, participantId]);
    expect(chatRepository.createDirectChat).not.toHaveBeenCalled();
    expect(result.created).toBe(false);
    expect(result.chat.readOnly).toBe(true);
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });

  it('should not create a chat with a deactivated participant', async () => {
    vi.mocked(userRepository.findBy).mockResolvedValueOnce([
      makeUser(userId),
      makeUser(participantId, UserStatus.DEACTIVATED),
    ]);

    const promise = useCase.execute({ participantId }, userId);

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.USER_NOT_FOUND);
    expect(chatRepository.createDirectChat).not.toHaveBeenCalled();
  });
});

describe('CreateDirectChatSchema', () => {
  it('should reject a participant id that is not an uuid', () => {
    const result = CreateDirectChatSchema.safeParse({ participantId: 'invalid' });

    expect(result.error?.issues[0].message).toBe('Participant inválido');
  });

  it('should lowercase the participant id', () => {
    expect(
      CreateDirectChatSchema.parse({ participantId: participantId.toUpperCase() }).participantId,
    ).toBe(participantId);
  });
});
