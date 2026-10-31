import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatDetails, IChatRepository } from '../../repository/chat-repository.interface';
import { GetChatUseCase } from './get-chat.usecase';
import { GetChatSchema } from './get-chat.schema';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { NotFoundException } from '@/shared/errors/errors';

const userId = '0199b7a0-0000-7000-8000-000000000001';
const otherId = '0199b7a0-0000-7000-8000-000000000002';
const chatId = '0199b7a0-0000-7000-8000-0000000000aa';

const makeChat = (isGroup: boolean, otherStatus = UserStatus.ACTIVE): ChatDetails => ({
  id: chatId,
  isGroup,
  title: isGroup ? 'Viagem' : null,
  createdBy: userId,
  createdAt: new Date('2026-10-27T12:00:00Z'),
  participants: [
    { id: userId, name: 'Ana Souza', nickname: 'ana', status: UserStatus.ACTIVE },
    { id: otherId, name: 'Bruno Lima', nickname: 'bruno', status: otherStatus },
  ],
});

const mockChatRepository = (): IChatRepository => ({
  createDirectChat: vi.fn(),
  findDirectChat: vi.fn(),
  createGroup: vi.fn(),
  findById: vi.fn().mockResolvedValue(makeChat(false)),
  findByParticipant: vi.fn(),
});

describe('GetChatUseCase', () => {
  let chatRepository: IChatRepository;
  let useCase: GetChatUseCase;

  beforeEach(() => {
    chatRepository = mockChatRepository();
    useCase = new GetChatUseCase(chatRepository);
  });

  it('should return the chat filtered by participant', async () => {
    const result = await useCase.execute({ id: chatId }, userId);

    expect(chatRepository.findById).toHaveBeenCalledWith(chatId, userId);
    expect(result.readOnly).toBe(false);
    expect(result.participants[1]).toEqual({ id: otherId, name: 'Bruno Lima', nickname: 'bruno' });
  });

  it('should mark a direct chat with a deactivated participant as read-only', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(
      makeChat(false, UserStatus.DEACTIVATED),
    );

    expect((await useCase.execute({ id: chatId }, userId)).readOnly).toBe(true);
  });

  it('should not mark a group with a deactivated participant as read-only', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(
      makeChat(true, UserStatus.DEACTIVATED),
    );

    expect((await useCase.execute({ id: chatId }, userId)).readOnly).toBe(false);
  });

  it('should throw NotFoundException when the chat is not found for the participant', async () => {
    vi.mocked(chatRepository.findById).mockResolvedValueOnce(null);

    const promise = useCase.execute({ id: chatId }, userId);

    await expect(promise).rejects.toBeInstanceOf(NotFoundException);
    await expect(promise).rejects.toThrow(MessageError.CHAT_NOT_FOUND);
  });
});

describe('GetChatSchema', () => {
  it('should reject an id that is not an uuid', () => {
    expect(GetChatSchema.safeParse({ id: 'invalid' }).error?.issues[0].message).toBe(
      'Chat inválido',
    );
  });
});
