import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteMessageUseCase } from './delete-message.usecase';
import { DeleteMessageSchema } from './delete-message.schema';
import { IMessageRepository, MessageDetails } from '../../repository/message-repository.interface';
import {
  ChatDetails,
  ChatParticipant,
  IChatRepository,
} from '@/modules/chats/repository/chat-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { ContentStatus } from '@/shared/enums/messages/content-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@/shared/errors/errors';

const userId = '0199b7a0-0000-7000-8000-000000000001';
const otherId = '0199b7a0-0000-7000-8000-000000000002';
const chatId = '0199b7a0-0000-7000-8000-0000000000aa';
const messageId = '0199b7a0-0000-7000-8000-0000000000bb';

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

const makeMessage = (data: Partial<MessageDetails> = {}): MessageDetails => ({
  id: messageId,
  chatId,
  senderId: userId,
  content: 'Oi',
  contentStatus: ContentStatus.ORIGINAL,
  editedAt: null,
  ...data,
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn(),
  findDirectChat: vi.fn(),
  createGroup: vi.fn(),
  findById: vi.fn().mockResolvedValue(makeChat()),
  findByParticipant: vi.fn(),
  enrichWithParticipants: vi.fn(),
});

const mockMessageRepository = (): IMessageRepository => ({
  persist: vi.fn(),
  findByChat: vi.fn(),
  findById: vi.fn().mockResolvedValue(makeMessage()),
  edit: vi.fn(),
  delete: vi.fn().mockResolvedValue(true),
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

describe('DeleteMessageUseCase', () => {
  let chatRepository: IChatRepository;
  let messageRepository: IMessageRepository;
  let queue: IQueueProvider;
  let useCase: DeleteMessageUseCase;

  const execute = () => useCase.execute({ chatId, id: messageId }, userId);

  beforeEach(() => {
    chatRepository = mockChatRepository();
    messageRepository = mockMessageRepository();
    queue = mockQueueProvider();
    useCase = new DeleteMessageUseCase(chatRepository, messageRepository, queue, mockLogger());
  });

  it('should delete the message and publish message.deleted to all participants', async () => {
    await execute();

    expect(chatRepository.findById).toHaveBeenCalledWith(chatId, userId);
    expect(messageRepository.findById).toHaveBeenCalledWith(messageId, chatId);
    expect(messageRepository.delete).toHaveBeenCalledWith({
      id: messageId,
      chatId,
      deletedAt: expect.any(Date),
    });

    const { deletedAt } = vi.mocked(messageRepository.delete).mock.calls[0][0];

    expect(queue.publishExchange).toHaveBeenCalledWith(
      Exchange.EVENTS,
      RoutingKey.MESSAGE_DELETED,
      {
        participantIds: [userId, otherId],
        message: { id: messageId, chatId, deletedAt },
      },
    );
  });

  it('should keep the deletion when the broker fails', async () => {
    vi.mocked(queue.publishExchange).mockRejectedValueOnce(new Error('broker down'));

    await expect(execute()).resolves.toBeUndefined();
  });

  it('should throw not found when the chat does not exist or the user is not a participant', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(null);

    const promise = execute();

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.CHAT_NOT_FOUND);
    expect(messageRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw unauthorized when the sender is deactivated', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(
      makeChat(true, [
        makeParticipant(userId, UserStatus.DEACTIVATED),
        makeParticipant(otherId),
        makeParticipant('0199b7a0-0000-7000-8000-000000000003'),
      ]),
    );

    const promise = execute();

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(promise).rejects.toThrow(MessageError.INVALID_TOKEN);
    expect(messageRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw forbidden when the direct chat is read-only', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(
      makeChat(false, [makeParticipant(userId), makeParticipant(otherId, UserStatus.DEACTIVATED)]),
    );

    const promise = execute();

    await expect(promise).rejects.toBeInstanceOf(ForbiddenException);
    await expect(promise).rejects.toThrow(MessageError.READ_ONLY_CHAT);
    expect(messageRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw not found when the message is not persisted in the chat', async () => {
    vi.mocked(messageRepository.findById).mockResolvedValueOnce(null);

    const promise = execute();

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.MESSAGE_NOT_FOUND);
    expect(messageRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw forbidden when the user is not the sender', async () => {
    vi.mocked(messageRepository.findById).mockResolvedValueOnce(makeMessage({ senderId: otherId }));

    const promise = execute();

    await expect(promise).rejects.toBeInstanceOf(ForbiddenException);
    await expect(promise).rejects.toThrow(MessageError.NOT_MESSAGE_SENDER);
    expect(messageRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw conflict when the message is already deleted', async () => {
    vi.mocked(messageRepository.findById).mockResolvedValueOnce(
      makeMessage({ content: null, contentStatus: ContentStatus.DELETED }),
    );

    const promise = execute();

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(MessageError.MESSAGE_ALREADY_DELETED);
    expect(messageRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw conflict when the message is deleted concurrently', async () => {
    vi.mocked(messageRepository.delete).mockResolvedValueOnce(false);

    const promise = execute();

    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    expect(queue.publishExchange).not.toHaveBeenCalled();
  });
});

describe('DeleteMessageSchema', () => {
  it.each([
    [{ chatId: 'invalid', id: messageId }, 'Chat inválido'],
    [{ chatId, id: 'invalid' }, 'Mensagem inválida'],
  ])('should reject %j', (data, message) => {
    expect(DeleteMessageSchema.safeParse(data).error?.issues[0].message).toBe(message);
  });
});
