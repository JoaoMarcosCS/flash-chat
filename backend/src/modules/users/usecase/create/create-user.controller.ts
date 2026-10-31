import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { CreateUserSchema } from './create-user.schema';
import { container } from 'tsyringe';
import { CreateUserUseCase } from './create-user.usecase';

export class CreateUserController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(CreateUserSchema, req.body);

    const useCase = container.resolve(CreateUserUseCase);

    const user = await useCase.execute(safeData);

    return res.status(201).json(user);
  }
}
