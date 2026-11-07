import { ChatDetails, ChatParticipant } from '@/modules/chats/repository/chat-repository.interface';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@/shared/errors/errors';

export const ensureSenderCanWrite = (
  chat: ChatDetails | null,
  userId: string,
): { chat: ChatDetails; sender: ChatParticipant } => {
  if (!chat) {
    throw new NotFoundException(MessageError.CHAT_NOT_FOUND);
  }

  // usuário desativado não pode enviar mensagem
  const sender = chat.participants.find(({ id }) => id === userId);

  if (sender?.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedException(MessageError.INVALID_TOKEN);
  }

  // chat desativado (direct chat com um usuário desativo) não pode enviar mensagem
  if (!chat.isGroup && chat.participants.some(({ status }) => status === UserStatus.DEACTIVATED)) {
    throw new ForbiddenException(MessageError.READ_ONLY_CHAT);
  }

  return { chat, sender };
};
