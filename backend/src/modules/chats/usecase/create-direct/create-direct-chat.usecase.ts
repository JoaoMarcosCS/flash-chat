import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../repository/chat-repository.interface';
import { ChatResponse, toChatResponse } from '../../mapper/chat.mapper';
import { CreateDirectChatDTO } from './create-direct-chat.schema';
import { IUserRepository } from '@/modules/users/repository/user-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/shared/errors/errors';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { ChatCreatedEvent } from '../../event/chat-created.event';

export type CreateDirectChatResponse = {
  chat: ChatResponse;
  created: boolean;
};

@injectable()
export class CreateDirectChatUseCase {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute(
    { participantId }: CreateDirectChatDTO,
    userId: string,
  ): Promise<CreateDirectChatResponse> {
    this.logger.info('Executing CreateDirectChatUseCase', { data: { userId, participantId } });

    // regra de negócio: não é permitido criar chat consigo mesmo
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

    const existing = await this.chatRepository.findDirectChat([userId, participantId]);

    if (existing) {
      const chatWithParticipants = await this.chatRepository.enrichWithParticipants(existing);

      return { chat: toChatResponse(chatWithParticipants), created: false };
    }

    // não pode criar um chat com um usuário desativado
    // mas se já existir um chat direto com esse usuário, retorna o chat existente
    // o chat com um usuário desativado deve ser apenas read-only, não é permitido enviar mensagens para ele
    if (participant.status === UserStatus.DEACTIVATED) {
      throw new NotFoundException(MessageError.USER_NOT_FOUND);
    }

    const chatCreated = await this.chatRepository.createDirectChat({
      initiatorId: userId,
      participantId,
    });

    const response = toChatResponse(chatCreated);

    const event: ChatCreatedEvent = {
      participantIds: response.participants.map(({ id }) => id),
      chat: response,
    };

    //publica o evento de iniciação de conversa para o server ws emitir para o front-end dos participantes
    try {
      await this.queue.publishExchange(Exchange.EVENTS, RoutingKey.CHAT_CREATED, event);
    } catch (error) {
      this.logger.error('Failed to publish chat.created', { chatId: response.id, error });
    }

    return { chat: response, created: true };
  }
}
