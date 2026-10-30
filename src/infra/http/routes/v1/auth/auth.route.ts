import { Router } from 'express';
import { LoginController } from '@/modules/auth/usecase/login/login.controller';
import { RefreshController } from '@/modules/auth/usecase/refresh/refresh.controller';
import { LogoutController } from '@/modules/auth/usecase/logout/logout.controller';

const routes = Router();

const loginController = new LoginController();
const refreshController = new RefreshController();
const logoutController = new LogoutController();

routes.post('/login', (req, res) => loginController.handle(req, res));
routes.post('/refresh', (req, res) => refreshController.handle(req, res));
routes.post('/logout', (req, res) => logoutController.handle(req, res));

export { routes };
