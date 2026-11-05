import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../repository/chat-repository.interface';
import { ChatResponse, toChatResponse } from '../../mapper/chat.mapper';
import { CreateGroupDTO } from './create-group.schema';
import { IUserRepository } from '@/modules/users/repository/user-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/shared/errors/errors';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';

@injectable()
export class CreateGroupUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute({ title, participantIds }: CreateGroupDTO, userId: string): Promise<ChatResponse> {
    this.logger.info('Executing CreateGroupUseCase', { data: { userId, title, participantIds } });

    if (participantIds.includes(userId)) {
      throw new BadRequestException(MessageError.CANNOT_INCLUDE_YOURSELF);
    }

    // não se pode criar um grupo com usuários desativados
    const users = await this.userRepository.findBy({ ids: [userId, ...participantIds] });

    const activeIds = new Set(users.map(({ id }) => id));

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

    // publica o evento para notificar os participantes do novo grupo e atualizar suas listas de chats
    try {
      await this.queue.publishExchange(Exchange.EVENTS, RoutingKey.CHAT_CREATED, {
        participantIds: response.participants.map(({ id }) => id),
        chat: response,
      });
    } catch (error) {
      this.logger.error('Failed to publish chat.created', { chatId: response.id, error });
    }

    return response;
  }
}
