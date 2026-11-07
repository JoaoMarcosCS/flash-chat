import { inject, injectable } from 'tsyringe';
import {
  IUserRepository,
  UpdateUserData,
  UserProfile,
} from '../../repository/user-repository.interface';
import { UpdateUserDTO } from './update-user.schema';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@/shared/errors/errors';
import { hash } from '@/shared/utils/hash';
import { MessageError } from '@/shared/enums/erros.enum';
import { ILogger } from '@/infra/logger/logger.interface';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

@injectable()
export class UpdateUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute({ currentPassword, ...data }: UpdateUserDTO, userId: string): Promise<UserProfile> {
    this.logger.info('Executing UpdateUserUseCase', {
      data: { userId, fields: Object.keys(data) },
    });

    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    if (!(await hash.compare(currentPassword, user.password))) {
      throw new BadRequestException(MessageError.INVALID_CURRENT_PASSWORD);
    }

    const statusValues = [UserStatus.ACTIVE, UserStatus.DEACTIVATED];

    const [emailAlreadyExists, nicknameAlreadyExists] = await Promise.all([
      data.email
        ? this.userRepository.findBy({
            columns: { email: data.email },
            statusValues,
            excludeIds: [userId],
          })
        : [],
      data.nickname
        ? this.userRepository.findBy({
            columns: { nickname: data.nickname },
            statusValues,
            excludeIds: [userId],
          })
        : [],
    ]);

    if (emailAlreadyExists.length > 0) {
      throw new ConflictException(MessageError.EMAIL_ALREADY_EXISTS);
    } else if (nicknameAlreadyExists.length > 0) {
      throw new ConflictException(MessageError.NICKNAME_ALREADY_EXISTS);
    }

    const changes: UpdateUserData = { ...data };

    if (data.password) {
      changes.password = await hash.generate(data.password);
    }

    return await this.userRepository.update(userId, changes);
  }
}
