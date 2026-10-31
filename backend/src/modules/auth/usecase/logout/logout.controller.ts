import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { LogoutSchema } from './logout.schema';
import { LogoutUseCase } from './logout.usecase';
import { clearRefreshTokenCookie, readRefreshTokenCookie } from '../../token/refresh-token.cookie';

export class LogoutController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(LogoutSchema, { refreshToken: readRefreshTokenCookie(req) });

    const useCase = container.resolve(LogoutUseCase);

    await useCase.execute(safeData);

    clearRefreshTokenCookie(res);

    return res.status(204).send();
  }
}
