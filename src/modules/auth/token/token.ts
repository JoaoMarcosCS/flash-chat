import { sign, SignOptions, verify } from 'jsonwebtoken';
import { env } from '@/shared/environment/env';
import { UserEntity } from '@/modules/users/entity/user.entity';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type TokenUser = Pick<UserEntity, 'id' | 'name' | 'nickname'>;

export const generateTokens = (user: TokenUser): AuthTokens => {
  const accessToken = sign({ name: user.name, nickname: user.nickname }, env.JWT_SECRET, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

  const refreshToken = sign({}, env.JWT_REFRESH_SECRET, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): string | null => {
  try {
    const payload = verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    return typeof payload === 'string' || !payload.sub ? null : payload.sub;
  } catch {
    return null;
  }
};
