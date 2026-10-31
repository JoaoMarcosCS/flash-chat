import { Router } from 'express';
import { routes as usersRoute } from './users/users.route';
import { routes as authRoute } from './auth/auth.route';
import { routes as chatsRoute } from './chats/chats.route';

const routes = Router();

routes.use('/users', usersRoute);
routes.use('/auth', authRoute);
routes.use('/chats', chatsRoute);

export { routes };
