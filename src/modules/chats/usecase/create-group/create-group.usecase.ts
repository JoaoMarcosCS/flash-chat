import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../repository/IChatRepository';
import { ChatResponse, toChatResponse } from '../../mapper/chat.mapper';
import { CreateGroupDTO } from './create-group.schema';
import { IUserRepository } from '@/modules/users/repository/IUserRepository';
import { ILogger } from '@/infra/logger/ILogger';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/shared/errors/errors';

@injectable()
export class CreateGroupUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute({ title, participantIds }: CreateGroupDTO, userId: string): Promise<ChatResponse> {
    this.logger.info('Executing CreateGroupUseCase', { data: { userId, title, participantIds } });

    if (participantIds.includes(userId)) {
      throw new BadRequestException(MessageError.CANNOT_INCLUDE_YOURSELF);
    }

    const users = await this.userRepository.findBy({
      ids: [userId, ...participantIds],
      statusValues: [UserStatus.ACTIVE, UserStatus.DEACTIVATED],
    });

    const activeIds = new Set(
      users.filter(({ status }) => status === UserStatus.ACTIVE).map(({ id }) => id),
    );

    if (!activeIds.has(userId)) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    if (!participantIds.every((id) => activeIds.has(id))) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    const chat = await this.chatRepository.createGroup({
      initiatorId: userId,
      title,
      participantIds,
    });

    return toChatResponse(chat);
  }
}
