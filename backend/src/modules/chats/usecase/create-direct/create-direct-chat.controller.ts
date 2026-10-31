import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { CreateDirectChatSchema } from './create-direct-chat.schema';
import { container } from 'tsyringe';
import { CreateDirectChatUseCase } from './create-direct-chat.usecase';

export class CreateDirectChatController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(CreateDirectChatSchema, req.body);

    const useCase = container.resolve(CreateDirectChatUseCase);

    const { chat, created } = await useCase.execute(safeData, req.user.id);

    return res.status(created ? 201 : 200).json(chat);
  }
}
