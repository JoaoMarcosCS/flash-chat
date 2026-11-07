import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GetUserUseCase } from './get-user.usecase';

export class GetUserController {
  async handle(req: Request, res: Response): Promise<Response> {
    const useCase = container.resolve(GetUserUseCase);

    const user = await useCase.execute(req.user.id);

    return res.status(200).json(user);
  }
}
