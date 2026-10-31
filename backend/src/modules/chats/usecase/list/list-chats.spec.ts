import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatListItem, IChatRepository } from '../../repository/chat-repository.interface';
import { ListChatsUseCase } from './list-chats.usecase';
import { LIST_CHATS_DEFAULT_LIMIT, ListChatsSchema } from './list-chats.schema';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

const userId = '0199b7a0-0000-7000-8000-000000000001';
const cursor = '0199b7a0-0000-7000-8000-0000000000ff';

const lastMessage = {
  id: 'message-1',
  content: 'Bora amanhã',
  sender: { id: userId, name: 'Ana Souza' },
};

const makeDirect = (
  id: string,
  status = UserStatus.ACTIVE,
  message: ChatListItem['lastMessage'] = null,
): ChatListItem => ({
  id,
  isGroup: false,
  title: null,
  otherParticipant: { name: 'Bruno Lima', status },
  lastMessage: message,
});

const makeGroup = (id: string): ChatListItem => ({
  id,
  isGroup: true,
  title: 'Viagem',
  otherParticipant: null,
  lastMessage: null,
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn(),
  findDirectChat: vi.fn(),
  createGroup: vi.fn(),
  findById: vi.fn(),
  findByParticipant: vi.fn().mockResolvedValue([]),
});

describe('ListChatsUseCase', () => {
  let chatRepository: IChatRepository;
  let useCase: ListChatsUseCase;

  beforeEach(() => {
    chatRepository = mockChatRepository();
    useCase = new ListChatsUseCase(chatRepository);
  });

  it('should use default limit without search nor cursor', async () => {
    await useCase.execute(ListChatsSchema.parse({}), userId);

    expect(chatRepository.findByParticipant).toHaveBeenCalledWith({
      userId,
      value: undefined,
      cursor: undefined,
      limit: LIST_CHATS_DEFAULT_LIMIT + 1,
    });
  });

  it('should pass the tsquery and the cursor', async () => {
    await useCase.execute({ search: 'Bruno Li', cursor, limit: 10 }, userId);

    expect(chatRepository.findByParticipant).toHaveBeenCalledWith({
      userId,
      value: 'bruno:* & li:*',
      cursor,
      limit: 11,
    });
  });

  it('should treat a blank search as no search', async () => {
    await useCase.execute(ListChatsSchema.parse({ search: '   ' }), userId);

    expect(vi.mocked(chatRepository.findByParticipant).mock.calls[0][0].value).toBeUndefined();
  });

  it('should compute display name and read-only for each chat', async () => {
    vi.mocked(chatRepository.findByParticipant).mockResolvedValueOnce([
      makeDirect('c', UserStatus.ACTIVE, lastMessage),
      makeDirect('b', UserStatus.DEACTIVATED),
      makeGroup('a'),
    ]);

    const { data } = await useCase.execute({ limit: 20 }, userId);

    expect(data).toEqual([
      { id: 'c', isGroup: false, displayName: 'Bruno Lima', readOnly: false, lastMessage },
      { id: 'b', isGroup: false, displayName: 'Bruno Lima', readOnly: true, lastMessage: null },
      { id: 'a', isGroup: true, displayName: 'Viagem', readOnly: false, lastMessage: null },
    ]);
  });

  it('should use the last message id as nextCursor when the last chat has messages', async () => {
    vi.mocked(chatRepository.findByParticipant).mockResolvedValueOnce([
      makeDirect('c', UserStatus.ACTIVE, lastMessage),
      makeGroup('b'),
    ]);

    const result = await useCase.execute({ limit: 1 }, userId);

    expect(result.data.map((chat) => chat.id)).toEqual(['c']);
    expect(result.nextCursor).toBe('message-1');
  });

  it('should use the chat id as nextCursor when the last chat is empty', async () => {
    vi.mocked(chatRepository.findByParticipant).mockResolvedValueOnce([
      makeGroup('c'),
      makeGroup('b'),
    ]);

    expect((await useCase.execute({ limit: 1 }, userId)).nextCursor).toBe('c');
  });

  it('should return null nextCursor on the last page', async () => {
    vi.mocked(chatRepository.findByParticipant).mockResolvedValueOnce([makeGroup('a')]);

    expect((await useCase.execute({ limit: 20 }, userId)).nextCursor).toBeNull();
  });
});

describe('ListChatsSchema', () => {
  it.each(['a', ' a ', '&|', 'a!'])('should reject search %j', (search) => {
    expect(ListChatsSchema.safeParse({ search }).error?.issues[0].message).toBe(
      'Busca deve ter no mínimo 2 caracteres',
    );
  });

  it.each(['', '   '])('should accept blank search %j', (search) => {
    expect(ListChatsSchema.safeParse({ search }).success).toBe(true);
  });

  it('should coerce limit from query string', () => {
    expect(ListChatsSchema.parse({ limit: '5' }).limit).toBe(5);
  });

  it('should reject limit greater than 100', () => {
    expect(ListChatsSchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('should reject a cursor that is not an uuid', () => {
    expect(ListChatsSchema.safeParse({ cursor: 'invalid' }).success).toBe(false);
  });
});
