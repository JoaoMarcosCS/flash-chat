import { inject, injectable } from 'tsyringe';
import { IUserRepository, UserProfile } from '../../repository/user-repository.interface';
import { MessageError } from '@/shared/enums/erros.enum';
import { UnauthorizedException } from '@/shared/errors/errors';

@injectable()
export class GetUserUseCase {
  constructor(@inject('IUserRepository') private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findProfileById(userId);

    if (!user) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    return user;
  }
}
