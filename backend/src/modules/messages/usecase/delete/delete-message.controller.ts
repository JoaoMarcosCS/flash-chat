import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { DeleteMessageSchema } from './delete-message.schema';
import { container } from 'tsyringe';
import { DeleteMessageUseCase } from './delete-message.usecase';

export class DeleteMessageController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(DeleteMessageSchema, {
      chatId: req.params.chatId,
      id: req.params.id,
    });

    const useCase = container.resolve(DeleteMessageUseCase);

    await useCase.execute(safeData, req.user.id);

    return res.status(204).send();
  }
}
