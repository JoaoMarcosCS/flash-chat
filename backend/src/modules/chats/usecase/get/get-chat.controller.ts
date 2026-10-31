import { validateWithZod } from '@/shared/utils/validation-with-zod';
import { Request, Response } from 'express';
import { GetChatSchema } from './get-chat.schema';
import { container } from 'tsyringe';
import { GetChatUseCase } from './get-chat.usecase';

export class GetChatController {
  async handle(req: Request, res: Response): Promise<Response> {
    const safeData = validateWithZod(GetChatSchema, req.params);

    const useCase = container.resolve(GetChatUseCase);

    const chat = await useCase.execute(safeData, req.user.id);

    return res.status(200).json(chat);
  }
}
