import { inject, injectable } from 'tsyringe';
import { IUserRepository, PublicUser } from '../../repository/IUserRepository';
import { CreateUserDTO } from './create-user.schema';
import { ConflictException } from '@/shared/errors/errors';
import { hash } from '@/shared/utils/hash';
import { MessageError } from '@/shared/enums/erros.enum';
import { ILogger } from '@/infra/logger/ILogger';
import { UserStatus } from '@/shared/enums/users/user-status.enum';

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ILogger') private logger: ILogger,
  ) {}

  async execute(data: CreateUserDTO): Promise<PublicUser> {
    this.logger.info('Executing CreateUserUseCase', { data: { ...data, password: '***' } });

    const status = [UserStatus.ACTIVE, UserStatus.DEACTIVATED];

    const [emailAlreadyExists, nicknameAlreadyExists] = await Promise.all([
      this.userRepository.findBy({ columns: { email: data.email }, statusValues: status }),
      this.userRepository.findBy({ columns: { nickname: data.nickname }, statusValues: status }),
    ]);

    if (emailAlreadyExists.length > 0) {
      throw new ConflictException(MessageError.EMAIL_ALREADY_EXISTS);
    } else if (nicknameAlreadyExists.length > 0) {
      throw new ConflictException(MessageError.NICKNAME_ALREADY_EXISTS);
    }

    const hashedPassword = await hash.generate(data.password);

    return await this.userRepository.create({
      name: data.name,
      nickname: data.nickname,
      email: data.email,
      password: hashedPassword,
    });
  }
}
