import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { ListMessagesSchema } from './list-messages.schema';
import { container } from 'tsyringe';
import { ListMessagesUseCase } from './list-messages.usecase';

export class ListMessagesController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(ListMessagesSchema, { ...req.query, chatId: req.params.id });

    const useCase = container.resolve(ListMessagesUseCase);

    const result = await useCase.execute(safeData, req.user.id);

    return res.status(200).json(result);
  }
}
