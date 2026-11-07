import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { EditMessageSchema } from './edit-message.schema';
import { container } from 'tsyringe';
import { EditMessageUseCase } from './edit-message.usecase';

export class EditMessageController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(EditMessageSchema, {
      ...req.body,
      chatId: req.params.chatId,
      id: req.params.id,
    });

    const useCase = container.resolve(EditMessageUseCase);

    const message = await useCase.execute(safeData, req.user.id);

    return res.status(200).json(message);
  }
}
