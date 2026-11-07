import { Router } from 'express';
import { CreateDirectChatController } from '@/modules/chats/usecase/create-direct/create-direct-chat.controller';
import { CreateGroupController } from '@/modules/chats/usecase/create-group/create-group.controller';
import { GetChatController } from '@/modules/chats/usecase/get/get-chat.controller';
import { ListChatsController } from '@/modules/chats/usecase/list/list-chats.controller';
import { SendMessageController } from '@/modules/messages/usecase/send/send-message.controller';
import { ListMessagesController } from '@/modules/messages/usecase/list/list-messages.controller';
import { EditMessageController } from '@/modules/messages/usecase/edit/edit-message.controller';
import { DeleteMessageController } from '@/modules/messages/usecase/delete/delete-message.controller';
import { verifyToken } from '@/infra/http/middleware/auth';

const routes = Router();

const createDirectChatController = new CreateDirectChatController();
const createGroupController = new CreateGroupController();
const getChatController = new GetChatController();
const listChatsController = new ListChatsController();
const sendMessageController = new SendMessageController();
const listMessagesController = new ListMessagesController();
const editMessageController = new EditMessageController();
const deleteMessageController = new DeleteMessageController();

routes.post('/direct', verifyToken, (req, res) => createDirectChatController.handle(req, res));
routes.post('/groups', verifyToken, (req, res) => createGroupController.handle(req, res));
routes.get('/', verifyToken, (req, res) => listChatsController.handle(req, res));
routes.get('/:id', verifyToken, (req, res) => getChatController.handle(req, res));
routes.post('/:id/messages', verifyToken, (req, res) => sendMessageController.handle(req, res));
routes.get('/:id/messages', verifyToken, (req, res) => listMessagesController.handle(req, res));
routes.patch('/:chatId/messages/:id', verifyToken, (req, res) =>
  editMessageController.handle(req, res),
);
routes.delete('/:chatId/messages/:id', verifyToken, (req, res) =>
  deleteMessageController.handle(req, res),
);

export { routes };
