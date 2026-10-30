import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { SendMessageSchema } from './send-message.schema';
import { container } from 'tsyringe';
import { SendMessageUseCase } from './send-message.usecase';

export class SendMessageController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(SendMessageSchema, { ...req.body, id: req.params.id });

    const useCase = container.resolve(SendMessageUseCase);

    const message = await useCase.execute(safeData, req.user.id);

    return res.status(201).json(message);
  }
}
