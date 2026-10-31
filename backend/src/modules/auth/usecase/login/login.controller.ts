import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { LoginSchema } from './login.schema';
import { LoginUseCase } from './login.usecase';
import { setRefreshTokenCookie } from '../../token/refresh-token.cookie';

export class LoginController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(LoginSchema, req.body);

    const useCase = container.resolve(LoginUseCase);

    const tokens = await useCase.execute(safeData);

    setRefreshTokenCookie(res, tokens);

    return res.status(200).json({ accessToken: tokens.accessToken });
  }
}
