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

    clearRefreshTokenCookie(res);

    const useCase = container.resolve(RefreshUseCase);

    const tokens = await useCase.execute(safeData);

    setRefreshTokenCookie(res, tokens);

    return res.status(200).json({ accessToken: tokens.accessToken });
  }
}
