import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListMessagesUseCase } from './list-messages.usecase';
import { LIST_MESSAGES_DEFAULT_LIMIT, ListMessagesSchema } from './list-messages.schema';
import { ChatMessage, IMessageRepository } from '../../repository/message-repository.interface';
import { ChatDetails, IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { NotFoundException } from '@/shared/errors/errors';

const userId = '0199b7a0-0000-7000-8000-000000000001';
const chatId = '0199b7a0-0000-7000-8000-0000000000aa';
const cursor = '0199b7a0-0000-7000-8000-0000000000ff';

const chat: ChatDetails = {
  id: chatId,
  isGroup: false,
  title: null,
  createdBy: userId,
  createdAt: new Date('2026-10-27T12:00:00Z'),
  participants: [
    { id: userId, name: 'Ana Souza', nickname: 'ana', status: UserStatus.ACTIVE },
    {
      id: '0199b7a0-0000-7000-8000-000000000002',
      name: 'Bruno Lima',
      nickname: 'bruno',
      status: UserStatus.DEACTIVATED,
    },
  ],
};

const makeMessage = (id: string): ChatMessage => ({
  id,
  content: `Message ${id}`,
  createdAt: new Date('2026-10-27T12:00:00Z'),
  sender: { id: userId, name: 'Ana Souza' },
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn(),
  findDirectChat: vi.fn(),
  createGroup: vi.fn(),
  findById: vi.fn().mockResolvedValue(chat),
  findByParticipant: vi.fn(),
});

const mockMessageRepository = (): IMessageRepository => ({
  persist: vi.fn(),
  findByChat: vi.fn().mockResolvedValue([]),
});

describe('ListMessagesUseCase', () => {
  let chatRepository: IChatRepository;
  let messageRepository: IMessageRepository;
  let useCase: ListMessagesUseCase;

  beforeEach(() => {
    chatRepository = mockChatRepository();
    messageRepository = mockMessageRepository();
    useCase = new ListMessagesUseCase(chatRepository, messageRepository);
  });

  it('should use the default limit without cursor', async () => {
    await useCase.execute(ListMessagesSchema.parse({ id: chatId }), userId);

    expect(chatRepository.findById).toHaveBeenCalledWith(chatId, userId);
    expect(messageRepository.findByChat).toHaveBeenCalledWith({
      chatId,
      cursor: undefined,
      limit: LIST_MESSAGES_DEFAULT_LIMIT + 1,
    });
  });

  it('should list a read-only chat', async () => {
    vi.mocked(messageRepository.findByChat).mockResolvedValueOnce([makeMessage('b')]);

    const result = await useCase.execute({ id: chatId, cursor, limit: 20 }, userId);

    expect(result).toEqual({ data: [makeMessage('b')], nextCursor: null });
  });

  it('should return the last message id as nextCursor when there is a next page', async () => {
    vi.mocked(messageRepository.findByChat).mockResolvedValueOnce([
      makeMessage('c'),
      makeMessage('b'),
      makeMessage('a'),
    ]);

    const result = await useCase.execute({ id: chatId, limit: 2 }, userId);

    expect(result.data.map(({ id }) => id)).toEqual(['c', 'b']);
    expect(result.nextCursor).toBe('b');
  });

  it('should throw not found when the user is not a participant', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(null);

    const promise = useCase.execute({ id: chatId, limit: 20 }, userId);

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.CHAT_NOT_FOUND);
    expect(messageRepository.findByChat).not.toHaveBeenCalled();
  });
});

describe('ListMessagesSchema', () => {
  it('should reject a chat id that is not an uuid', () => {
    expect(ListMessagesSchema.safeParse({ id: 'invalid' }).error?.issues[0].message).toBe(
      'Chat inválido',
    );
  });

  it('should reject a cursor that is not an uuid', () => {
    expect(ListMessagesSchema.safeParse({ id: chatId, cursor: 'invalid' }).success).toBe(false);
  });

  it('should coerce limit from query string', () => {
    expect(ListMessagesSchema.parse({ id: chatId, limit: '5' }).limit).toBe(5);
  });

  it('should reject limit greater than 100', () => {
    expect(ListMessagesSchema.safeParse({ id: chatId, limit: '101' }).success).toBe(false);
  });
});
