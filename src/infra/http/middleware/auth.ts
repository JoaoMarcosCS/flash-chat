import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { env } from '@/shared/environment/env';
import { UnauthorizedException } from '@/shared/errors/errors';
import { MessageError } from '@/shared/enums/erros.enum';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const [scheme, token] = req.header('authorization')?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedException(MessageError.TOKEN_NOT_PROVIDED);
  }

  try {
    const payload = verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });

    if (typeof payload === 'string' || !payload.sub) {
      throw new UnauthorizedException(MessageError.INVALID_TOKEN);
    }

    req.user = {
      id: payload.sub,
      name: payload.name,
      nickname: payload.nickname,
    };
  } catch {
    throw new UnauthorizedException(MessageError.INVALID_TOKEN);
  }

  next();
};
