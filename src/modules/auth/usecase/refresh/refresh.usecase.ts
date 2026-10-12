import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '@/modules/users/repository/IUserRepository';
import { UnauthorizedException } from '@/shared/errors/errors';
import { MessageError } from '@/shared/enums/erros.enum';
import { AuthTokens, generateTokens, verifyRefreshToken } from '../../token/token';
import { RefreshDTO } from './refresh.schema';

@injectable()
export class RefreshUseCase {
  constructor(@inject('IUserRepository') private userRepository: IUserRepository) {}

  async execute(data: RefreshDTO): Promise<AuthTokens> {
    const userId = verifyRefreshToken(data.refreshToken);

    if (!userId) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    const [user] = (await this.userRepository.findBy({ ids: [userId] })) ?? [];

    if (!user) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    return generateTokens(user);
  }
}
