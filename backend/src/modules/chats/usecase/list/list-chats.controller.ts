import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { ListChatsSchema } from './list-chats.schema';
import { container } from 'tsyringe';
import { ListChatsUseCase } from './list-chats.usecase';

export class ListChatsController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(ListChatsSchema, req.query);

    const useCase = container.resolve(ListChatsUseCase);

    const result = await useCase.execute(safeData, req.user.id);

    return res.status(200).json(result);
  }
}
