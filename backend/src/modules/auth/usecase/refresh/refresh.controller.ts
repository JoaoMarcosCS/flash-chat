import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { RefreshSchema } from './refresh.schema';
import { RefreshUseCase } from './refresh.usecase';
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../../token/refresh-token.cookie';

export class RefreshController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(RefreshSchema, { refreshToken: readRefreshTokenCookie(req) });

    // remove o refresh token do cookie antes de gerar um novo
    clearRefreshTokenCookie(res);

    const useCase = container.resolve(RefreshUseCase);

    const tokens = await useCase.execute(safeData);

    // adiciona o novo refresh token no cookie do response
    setRefreshTokenCookie(res, tokens);

    return res.status(200).json({ accessToken: tokens.accessToken });
  }
}
