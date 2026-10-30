import { Router } from 'express';
import { CreateDirectChatController } from '@/modules/chats/usecase/create-direct/create-direct-chat.controller';
import { CreateGroupController } from '@/modules/chats/usecase/create-group/create-group.controller';
import { GetChatController } from '@/modules/chats/usecase/get/get-chat.controller';
import { ListChatsController } from '@/modules/chats/usecase/list/list-chats.controller';
import { SendMessageController } from '@/modules/messages/usecase/send/send-message.controller';
import { verifyToken } from '@/infra/http/middleware/auth';

const routes = Router();

const createDirectChatController = new CreateDirectChatController();
const createGroupController = new CreateGroupController();
const getChatController = new GetChatController();
const listChatsController = new ListChatsController();
const sendMessageController = new SendMessageController();

routes.post('/direct', verifyToken, (req, res) => createDirectChatController.handle(req, res));
routes.post('/groups', verifyToken, (req, res) => createGroupController.handle(req, res));
routes.get('/', verifyToken, (req, res) => listChatsController.handle(req, res));
routes.get('/:id', verifyToken, (req, res) => getChatController.handle(req, res));
routes.post('/:id/messages', verifyToken, (req, res) => sendMessageController.handle(req, res));

export { routes };
