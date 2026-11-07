import { Router } from 'express';
import { CreateUserController } from '@/modules/users/usecase/create/create-user.controller';
import { SearchUsersController } from '@/modules/users/usecase/search/search-users.controller';
import { GetUserController } from '@/modules/users/usecase/get/get-user.controller';
import { UpdateUserController } from '@/modules/users/usecase/update/update-user.controller';
import { DeactivateUserController } from '@/modules/users/usecase/deactivate/deactivate-user.controller';
import { verifyToken } from '@/infra/http/middleware/auth';
import { authLimiter, currentPasswordLimiter } from '@/infra/http/security/rate-limit.config';

const routes = Router();

const createUserController = new CreateUserController();
const searchUsersController = new SearchUsersController();
const getUserController = new GetUserController();
const updateUserController = new UpdateUserController();
const deactivateUserController = new DeactivateUserController();

routes.post('/', authLimiter, (req, res) => createUserController.handle(req, res));
routes.get('/', verifyToken, (req, res) => searchUsersController.handle(req, res));
routes.get('/me', verifyToken, (req, res) => getUserController.handle(req, res));
routes.patch('/me', verifyToken, currentPasswordLimiter, (req, res) =>
  updateUserController.handle(req, res),
);
routes.delete('/me', verifyToken, currentPasswordLimiter, (req, res) =>
  deactivateUserController.handle(req, res),
);

export { routes };
