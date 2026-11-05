import { inject, injectable } from 'tsyringe';
import { IUserRepository } from '@/modules/users/repository/user-repository.interface';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { UnauthorizedException } from '@/shared/errors/errors';
import { MessageError } from '@/shared/enums/erros.enum';
import { AuthTokens, generateTokens, verifyRefreshToken } from '../../token/token';
import { saveSession, sessionKey } from '../../token/session';
import { RefreshDTO } from './refresh.schema';

@injectable()
export class RefreshUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ICacheProvider') private cache: ICacheProvider,
  ) {}

  async execute({ refreshToken }: RefreshDTO): Promise<AuthTokens> {
    const payload = refreshToken ? verifyRefreshToken(refreshToken) : null;

    if (!payload) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    // exclui o user id do cache se ele existir
    // se a chave não existir, significa que o refresh token já foi invalidado e a sessão
    // não deve ser renovada, deslogando o usuário e forçando-o a logar novamente
    const sessionUserId = await this.cache.getAndDelete<string>(sessionKey(payload.sessionId));

    if (sessionUserId !== payload.userId) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    const [user] = await this.userRepository.findBy({ ids: [payload.userId] });

    if (!user) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    const tokens = generateTokens(user);

    // salva o user id no cache para validação futura
    await saveSession(this.cache, user.id, tokens);

    return tokens;
  }
}
