import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../repository/chat-repository.interface';
import { ChatResponse, toChatResponse } from '../../mapper/chat.mapper';
import { CreateDirectChatDTO } from './create-direct-chat.schema';
import { publishChatCreated } from '../../event/chat-created.event';
import { IUserRepository } from '@/modules/users/repository/user-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/shared/errors/errors';

export type CreateDirectChatResponse = {
  chat: ChatResponse;
  created: boolean;
};

@injectable()
export class CreateDirectChatUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute(
    { participantId }: CreateDirectChatDTO,
    userId: string,
  ): Promise<CreateDirectChatResponse> {
    this.logger.info('Executing CreateDirectChatUseCase', { data: { userId, participantId } });

    if (participantId === userId) {
      throw new BadRequestException(MessageError.CANNOT_INCLUDE_YOURSELF);
    }

    const users = await this.userRepository.findBy({
      ids: [userId, participantId],
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
    });

    const initiator = users.find(({ id }) => id === userId);
    const participant = users.find(({ id }) => id === participantId);

    if (initiator?.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    if (!participant) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    if (participant.status === UserStatus.DEACTIVATED) {
      const existing = await this.chatRepository.findDirectChat([userId, participantId]);

      if (!existing) {
        throw new NotFoundException(MessageError.USER_NOT_FOUND);
      }

      return { chat: toChatResponse(existing), created: false };
    }

    const { chat, created } = await this.chatRepository.createDirectChat({
      initiatorId: userId,
      participantId,
    });

    const response = toChatResponse(chat);

    if (created) {
      await publishChatCreated(response, this.logger);
    }

    return { chat: response, created };
  }
}
