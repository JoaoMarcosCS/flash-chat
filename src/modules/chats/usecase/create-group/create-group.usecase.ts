import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../repository/chat-repository.interface';
import { ChatResponse, toChatResponse } from '../../mapper/chat.mapper';
import { CreateGroupDTO } from './create-group.schema';
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

    const response = toChatResponse(chat);

    await publishChatCreated(response, this.logger);

    return response;
  }
}
