import { MessageDetails } from '../repository/message-repository.interface';
import { ChatDetails, ChatParticipant } from '@/modules/chats/repository/chat-repository.interface';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { ContentStatus } from '@/shared/enums/messages/content-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  ConflictException,
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

export const ensureSenderCanChange = (
  message: MessageDetails | null,
  userId: string,
): MessageDetails => {
  if (!message) {
    throw new NotFoundException(MessageError.MESSAGE_NOT_FOUND);
  }

  if (message.senderId !== userId) {
    throw new ForbiddenException(MessageError.NOT_MESSAGE_SENDER);
  }

  if (message.contentStatus === ContentStatus.DELETED) {
    throw new ConflictException(MessageError.MESSAGE_ALREADY_DELETED);
  }

  return message;
};
