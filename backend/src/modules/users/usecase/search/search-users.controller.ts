import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { SearchUsersSchema } from './search-users.schema';
import { container } from 'tsyringe';
import { SearchUsersUseCase } from './search-users.usecase';

export class SearchUsersController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(SearchUsersSchema, req.query);

    const useCase = container.resolve(SearchUsersUseCase);

    const result = await useCase.execute(safeData, req.user.id);

    return res.status(200).json(result);
  }
}
