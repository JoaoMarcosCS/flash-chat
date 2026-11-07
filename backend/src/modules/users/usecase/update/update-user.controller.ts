import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { UpdateUserSchema } from './update-user.schema';
import { container } from 'tsyringe';
import { UpdateUserUseCase } from './update-user.usecase';

export class UpdateUserController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(UpdateUserSchema, req.body);

    const useCase = container.resolve(UpdateUserUseCase);

    const user = await useCase.execute(safeData, req.user.id);

    return res.status(200).json(user);
  }
}
