import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SendMessageUseCase } from './send-message.usecase';
import { MESSAGE_CONTENT_MAX_LENGTH, SendMessageSchema } from './send-message.schema';
import {
  ChatDetails,
  ChatParticipant,
  IChatRepository,
} from '@/modules/chats/repository/chat-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@/shared/errors/errors';

const userId = '0199b7a0-0000-7000-8000-000000000001';
const otherId = '0199b7a0-0000-7000-8000-000000000002';
const chatId = '0199b7a0-0000-7000-8000-0000000000aa';

const makeParticipant = (id: string, status = UserStatus.ACTIVE): ChatParticipant => ({
  id,
  name: id === userId ? 'Ana Souza' : 'Bruno Lima',
  nickname: id === userId ? 'ana' : 'bruno',
  status,
});

const makeChat = (
  isGroup = false,
  participants = [makeParticipant(userId), makeParticipant(otherId)],
): ChatDetails => ({
  id: chatId,
  isGroup,
  title: isGroup ? 'Viagem' : null,
  createdBy: userId,
  createdAt: new Date('2026-10-27T12:00:00Z'),
  participants,
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn(),
  findDirectChat: vi.fn(),
  createGroup: vi.fn(),
  findById: vi.fn().mockResolvedValue(makeChat()),
  findByParticipant: vi.fn(),
  enrichWithParticipants: vi.fn(),
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

describe('SendMessageUseCase', () => {
  let chatRepository: IChatRepository;
  let queue: IQueueProvider;
  let useCase: SendMessageUseCase;

  beforeEach(() => {
    chatRepository = mockChatRepository();
    queue = mockQueueProvider();
    useCase = new SendMessageUseCase(chatRepository, queue, mockLogger());
  });

  it('should publish message.published to all participants and return id and createdAt', async () => {
    const result = await useCase.execute({ id: chatId, content: 'Oi' }, userId);

    expect(chatRepository.findById).toHaveBeenCalledWith(chatId, userId);
    expect(queue.publishExchange).toHaveBeenCalledWith(
      Exchange.EVENTS,
      RoutingKey.MESSAGE_PUBLISHED,
      {
        participantIds: [userId, otherId],
        message: {
          id: result.id,
          chatId,
          content: 'Oi',
          createdAt: result.createdAt,
          sender: { id: userId, name: 'Ana Souza' },
        },
      },
    );
  });

  it('should generate an uuidv7 from the same instant as createdAt', async () => {
    const { id, createdAt } = await useCase.execute({ id: chatId, content: 'Oi' }, userId);

    const timestamp = parseInt(id.replace(/-/g, '').slice(0, 12), 16);

    expect(id[14]).toBe('7');
    expect(timestamp).toBe(createdAt.getTime());
  });

  it('should throw not found when the chat does not exist or the user is not a participant', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(null);

    const promise = useCase.execute({ id: chatId, content: 'Oi' }, userId);

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.CHAT_NOT_FOUND);
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });

  it('should throw unauthorized when the sender is deactivated', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(
      makeChat(true, [
        makeParticipant(userId, UserStatus.DEACTIVATED),
        makeParticipant(otherId),
        makeParticipant('0199b7a0-0000-7000-8000-000000000003'),
      ]),
    );

    const promise = useCase.execute({ id: chatId, content: 'Oi' }, userId);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });

  it('should throw forbidden when the direct chat is read-only', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(
      makeChat(false, [makeParticipant(userId), makeParticipant(otherId, UserStatus.DEACTIVATED)]),
    );

    const promise = useCase.execute({ id: chatId, content: 'Oi' }, userId);

    await expect(promise).rejects.toBeInstanceOf(ForbiddenException);
    await expect(promise).rejects.toThrow(MessageError.READ_ONLY_CHAT);
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });

  it('should send to a group with a deactivated participant', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(
      makeChat(true, [
        makeParticipant(userId),
        makeParticipant(otherId, UserStatus.DEACTIVATED),
        makeParticipant('0199b7a0-0000-7000-8000-000000000003'),
      ]),
    );

    await useCase.execute({ id: chatId, content: 'Oi' }, userId);

    expect(queue.publishExchange).toHaveBeenCalledOnce();
  });

  it('should throw service unavailable when the broker fails', async () => {
    vi.mocked(queue.publishExchange).mockRejectedValueOnce(new Error('broker down'));

    const promise = useCase.execute({ id: chatId, content: 'Oi' }, userId);

    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(promise).rejects.toThrow(MessageError.MESSAGE_NOT_SENT);
  });
});

describe('SendMessageSchema', () => {
  it('should trim the content', () => {
    expect(SendMessageSchema.parse({ id: chatId, content: '  Oi  ' }).content).toBe('Oi');
  });

  it.each([
    [{ id: 'invalid', content: 'Oi' }, 'Chat inválido'],
    [{ id: chatId }, 'Mensagem é obrigatória'],
    [{ id: chatId, content: '   ' }, 'Mensagem é obrigatória'],
    [
      { id: chatId, content: 'a'.repeat(MESSAGE_CONTENT_MAX_LENGTH + 1) },
      'Mensagem deve ter no máximo 1000 caracteres',
    ],
  ])('should reject %j', (data, message) => {
    expect(SendMessageSchema.safeParse(data).error?.issues[0].message).toBe(message);
  });

  it('should accept content with 1000 characters', () => {
    expect(
      SendMessageSchema.safeParse({ id: chatId, content: 'a'.repeat(MESSAGE_CONTENT_MAX_LENGTH) })
        .success,
    ).toBe(true);
  });
});
