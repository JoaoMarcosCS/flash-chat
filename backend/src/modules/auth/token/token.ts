import { decode, JwtPayload, sign, SignOptions, verify } from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';
import { env } from '@/shared/environment/env';
import { UserEntity } from '@/modules/users/entity/user.entity';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  refreshExpiresAt: number;
};

export type RefreshTokenPayload = {
  userId: string;
  sessionId: string;
};

type TokenUser = Pick<UserEntity, 'id' | 'name' | 'nickname'>;

export type AccessTokenPayload = TokenUser & {
  expiresAt: number;
};

export const generateTokens = (user: TokenUser): AuthTokens => {
  const accessToken = sign({ name: user.name, nickname: user.nickname }, env.JWT_SECRET, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

  const sessionId = uuidv7();

  const refreshToken = sign({}, env.JWT_REFRESH_SECRET, {
    subject: user.id,
    jwtid: sessionId,
    algorithm: 'HS256',
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });

  const { exp } = decode(refreshToken) as JwtPayload;

  return { accessToken, refreshToken, sessionId, refreshExpiresAt: (exp ?? 0) * 1000 };
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const payload = verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

    if (typeof payload === 'string' || !payload.sub || !payload.jti) {
      return null;
    }

    return { userId: payload.sub, sessionId: payload.jti };
  } catch {
    return null;
  }
};

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    const payload = verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

    if (typeof payload === 'string' || !payload.sub || !payload.exp) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      nickname: payload.nickname,
      expiresAt: payload.exp * 1000,
    };
  } catch {
    return null;
  }
};
