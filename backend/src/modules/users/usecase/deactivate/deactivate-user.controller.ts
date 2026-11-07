import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { DeactivateUserSchema } from './deactivate-user.schema';
import { container } from 'tsyringe';
import { DeactivateUserUseCase } from './deactivate-user.usecase';
import { clearRefreshTokenCookie } from '@/modules/auth/token/refresh-token.cookie';

export class DeactivateUserController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(DeactivateUserSchema, req.body);

    const useCase = container.resolve(DeactivateUserUseCase);

    await useCase.execute(safeData, req.user.id);

    clearRefreshTokenCookie(res);

    return res.status(204).send();
  }
}
