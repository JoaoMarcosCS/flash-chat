import { Router } from 'express';
import { CreateUserController } from '@/modules/users/usecase/create/create-user.controller';
import { SearchUsersController } from '@/modules/users/usecase/search/search-users.controller';
import { verifyToken } from '@/infra/http/middleware/auth';
import { authLimiter } from '@/infra/http/security/rate-limit.config';

const routes = Router();

const createUserController = new CreateUserController();
const searchUsersController = new SearchUsersController();

routes.post('/', authLimiter, (req, res) => createUserController.handle(req, res));
routes.get('/', verifyToken, (req, res) => searchUsersController.handle(req, res));

export { routes };
