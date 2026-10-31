import { inject, injectable } from 'tsyringe';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { verifyRefreshToken } from '../../token/token';
import { sessionKey } from '../../token/session';
import { LogoutDTO } from './logout.schema';

@injectable()
export class LogoutUseCase {
  constructor(@inject('ICacheProvider') private cache: ICacheProvider) {}

  async execute({ refreshToken }: LogoutDTO): Promise<void> {
    const payload = refreshToken ? verifyRefreshToken(refreshToken) : null;

    if (payload) {
      await this.cache.invalidate(sessionKey(payload.sessionId));
    }
  }
}
