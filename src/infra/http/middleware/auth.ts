import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@/modules/auth/token/token';
import { UnauthorizedException } from '@/shared/errors/errors';
import { MessageError } from '@/shared/enums/erros.enum';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const [scheme, token] = req.header('authorization')?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedException(MessageError.TOKEN_NOT_PROVIDED);
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    throw new UnauthorizedException(MessageError.INVALID_TOKEN);
  }

  req.user = { id: payload.id, name: payload.name, nickname: payload.nickname };

  next();
};
