import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '@/modules/users/repository/user-repository.interface';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { UnauthorizedException } from '@/shared/errors/errors';
import { MessageError } from '@/shared/enums/erros.enum';
import { hash } from '@/shared/utils/hash';
import { AuthTokens, generateTokens } from '../../token/token';
import { saveSession } from '../../token/session';
import { LoginDTO } from './login.schema';

@injectable()
export class LoginUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ICacheProvider') private cache: ICacheProvider,
  ) {}

  async execute(data: LoginDTO): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmailWithPassword(data.email);

    if (!user || !(await hash.compare(data.password, user.password))) {
      throw new UnauthorizedException(MessageError.INVALID_CREDENTIALS);
    }

    const tokens = generateTokens(user);

    // salva o user id no cache para validação futura
    await saveSession(this.cache, user.id, tokens);

    return tokens;
  }
}
