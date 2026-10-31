import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { CreateGroupSchema } from './create-group.schema';
import { container } from 'tsyringe';
import { CreateGroupUseCase } from './create-group.usecase';

export class CreateGroupController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(CreateGroupSchema, req.body);

    const useCase = container.resolve(CreateGroupUseCase);

    const chat = await useCase.execute(safeData, req.user.id);

    return res.status(201).json(chat);
  }
}
