import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '../../repository/user-repository.interface';
import { UserDeactivatedEvent } from '../../event/user-deactivated.event';
import { DeactivateUserDTO } from './deactivate-user.schema';
import { IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { Exchange, RoutingKey } from '@/shared/enums/queue/queue.enum';
import { UserStatus } from '@/shared/enums/users/user-status.enum';
import { MessageError } from '@/shared/enums/erros.enum';
import { BadRequestException, UnauthorizedException } from '@/shared/errors/errors';
import { hash } from '@/shared/utils/hash';

@injectable()
export class DeactivateUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IQueueProvider') private queue: IQueueProvider,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute({ currentPassword }: DeactivateUserDTO, userId: string): Promise<void> {
    this.logger.info('Executing DeactivateUserUseCase', { data: { userId } });

    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    if (!(await hash.compare(currentPassword, user.password))) {
      throw new BadRequestException(MessageError.INVALID_CURRENT_PASSWORD);
    }

    await this.userRepository.update(userId, { status: UserStatus.DEACTIVATED });

    const event: UserDeactivatedEvent = {
      participantIds: await this.chatRepository.findCoParticipantIds(userId),
      user: { id: userId },
    };

    try {
      await this.queue.publishExchange(Exchange.EVENTS, RoutingKey.USER_DEACTIVATED, event);
    } catch (error) {
      this.logger.error('Failed to publish user.deactivated', { userId, error });
    }
  }
}
