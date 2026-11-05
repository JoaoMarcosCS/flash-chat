import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatDetails, IChatRepository } from '../../repository/chat-repository.interface';
import { CreateGroupUseCase } from './create-group.usecase';
import { CreateGroupDTO, CreateGroupSchema } from './create-group.schema';
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
const brunoId = '0199b7a0-0000-7000-8000-000000000002';
const carlaId = '0199b7a0-0000-7000-8000-000000000003';

const dto: CreateGroupDTO = { title: 'Viagem', participantIds: [brunoId, carlaId] };

const makeUser = (id: string, status = UserStatus.ACTIVE): PublicUser => ({
  id,
  name: `User ${id.slice(-1)}`,
  nickname: `user${id.slice(-1)}`,
  status,
});

const makeGroup = (participantStatus = UserStatus.ACTIVE): ChatDetails => ({
  id: '0199b7a0-0000-7000-8000-0000000000aa',
  isGroup: true,
  title: 'Viagem',
  createdBy: userId,
  createdAt: new Date('2026-10-27T12:00:00Z'),
  participants: [makeUser(userId), makeUser(brunoId), makeUser(carlaId, participantStatus)],
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn(),
  findDirectChat: vi.fn(),
  createGroup: vi.fn().mockResolvedValue(makeGroup()),
  findById: vi.fn(),
  findByParticipant: vi.fn(),
  enrichWithParticipants: vi.fn(),
});

const mockUserRepository = (): IUserRepository => ({
  findBy: vi.fn().mockResolvedValue([makeUser(userId), makeUser(brunoId), makeUser(carlaId)]),
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

const messagesOf = (input: unknown) =>
  CreateGroupSchema.safeParse(input).error?.issues.map((issue) => issue.message);

describe('CreateGroupUseCase', () => {
  let chatRepository: IChatRepository;
  let userRepository: IUserRepository;
  let useCase: CreateGroupUseCase;
  let logger: ILogger;
  let queue: IQueueProvider;

  beforeEach(() => {
    chatRepository = mockChatRepository();
    userRepository = mockUserRepository();
    logger = mockLogger();
    queue = mockQueueProvider();
    useCase = new CreateGroupUseCase(chatRepository, userRepository, queue, logger);
  });

  it('should create a group with the initiator', async () => {
    const result = await useCase.execute(dto, userId);

    expect(userRepository.findBy).toHaveBeenCalledWith({
      ids: [userId, brunoId, carlaId],
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
    });
    expect(chatRepository.createGroup).toHaveBeenCalledWith({
      initiatorId: userId,
      title: 'Viagem',
      participantIds: [brunoId, carlaId],
    });
    expect(result.participants).toEqual([
      { id: userId, name: 'User 1', nickname: 'user1' },
      { id: brunoId, name: 'User 2', nickname: 'user2' },
      { id: carlaId, name: 'User 3', nickname: 'user3' },
    ]);
  });

  it('should publish chat.created to all participants', async () => {
    const chat = await useCase.execute(dto, userId);

    expect(queue.publishExchange).toHaveBeenCalledWith(Exchange.EVENTS, RoutingKey.CHAT_CREATED, {
      participantIds: [userId, brunoId, carlaId],
      chat,
    });
  });

  it('should still return the group when publishing chat.created fails', async () => {
    vi.mocked(queue.publishExchange).mockRejectedValueOnce(new Error('broker down'));

    const chat = await useCase.execute(dto, userId);

    expect(chat.isGroup).toBe(true);
    expect(logger.error).toHaveBeenCalledWith('Failed to publish chat.created', expect.anything());
  });

  it('should never mark a group as read-only', async () => {
    vi.mocked(chatRepository.createGroup).mockResolvedValueOnce(makeGroup(UserStatus.DEACTIVATED));

    expect((await useCase.execute(dto, userId)).readOnly).toBe(false);
  });

  it('should reject the user among the participants', async () => {
    const promise = useCase.execute({ ...dto, participantIds: [brunoId, userId] }, userId);

    await expect(promise).rejects.toBeInstanceOf(BadRequestException);
    await expect(promise).rejects.toThrow(MessageError.CANNOT_INCLUDE_YOURSELF);
  });

  it('should throw UnauthorizedException when the initiator is deactivated', async () => {
    vi.mocked(userRepository.findBy).mockResolvedValueOnce([
      makeUser(userId, UserStatus.DEACTIVATED),
      makeUser(brunoId),
      makeUser(carlaId),
    ]);

    const promise = useCase.execute(dto, userId);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(chatRepository.createGroup).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', [makeUser(userId), makeUser(brunoId)]],
    [
      'deactivated',
      [makeUser(userId), makeUser(brunoId), makeUser(carlaId, UserStatus.DEACTIVATED)],
    ],
  ])('should throw NotFoundException when a participant is %s', async (_, users) => {
    vi.mocked(userRepository.findBy).mockResolvedValueOnce(users);

    const promise = useCase.execute(dto, userId);

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.USER_NOT_FOUND);
    expect(chatRepository.createGroup).not.toHaveBeenCalled();
  });
});

describe('CreateGroupSchema', () => {
  it('should trim the title and collapse repeated spaces', () => {
    expect(CreateGroupSchema.parse({ ...dto, title: '  Viagem   de   férias  ' }).title).toBe(
      'Viagem de férias',
    );
  });

  it('should accept emojis and symbols in the title', () => {
    expect(CreateGroupSchema.safeParse({ ...dto, title: 'Viagem 2026 ✈️ #férias!' }).success).toBe(
      true,
    );
  });

  it.each([
    [undefined, 'Título é obrigatório'],
    ['   ', 'Título é obrigatório'],
    ['a'.repeat(101), 'Título deve ter no máximo 100 caracteres'],
    ['Viagem\nférias', 'Título não pode conter quebras de linha ou tabulações'],
    ['Viagem\tférias', 'Título não pode conter quebras de linha ou tabulações'],
  ])('should reject title %j', (title, message) => {
    expect(messagesOf({ ...dto, title })).toContain(message);
  });

  it('should accept a title with exactly 100 characters', () => {
    expect(CreateGroupSchema.safeParse({ ...dto, title: 'a'.repeat(100) }).success).toBe(true);
  });

  it.each([
    [undefined],
    [[brunoId]],
    [
      Array.from(
        { length: 50 },
        (_, index) => `0199b7a0-0000-7000-8000-${String(index).padStart(12, '0')}`,
      ),
    ],
  ])('should reject participant ids out of range', (participantIds) => {
    expect(messagesOf({ ...dto, participantIds })).toContain(
      'Group deve ter de 3 a 50 Participants',
    );
  });

  it('should reject participant ids that are not uuids', () => {
    expect(messagesOf({ ...dto, participantIds: [brunoId, 'invalid'] })).toContain(
      'Participant inválido',
    );
  });

  it('should reject repeated participant ids ignoring case', () => {
    expect(messagesOf({ ...dto, participantIds: [brunoId, brunoId.toUpperCase()] })).toContain(
      'Participants repetidos',
    );
  });
});
