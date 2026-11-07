import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { SendMessageSchema } from '@/modules/messages/usecase/send/send-message.schema';
import { ListMessagesSchema } from '@/modules/messages/usecase/list/list-messages.schema';
import { EditMessageSchema } from '@/modules/messages/usecase/edit/edit-message.schema';
import { DeleteMessageSchema } from '@/modules/messages/usecase/delete/delete-message.schema';
import { errorResponse } from '../common/error.docs';

const SentMessageSchema = z
  .object({
    id: z.uuid().meta({ description: 'UUIDv7 gerado no mesmo instante do createdAt' }),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'SentMessage' });

const ContentStatusSchema = z.enum(['original', 'edited', 'deleted']).meta({ id: 'ContentStatus' });

const ChatMessageSchema = z
  .object({
    id: z.uuid(),
    content: z.string().nullable().meta({ description: 'null quando a Message foi apagada' }),
    contentStatus: ContentStatusSchema,
    createdAt: z.iso.datetime(),
    editedAt: z.iso.datetime().nullable(),
    deletedAt: z.iso.datetime().nullable(),
    sender: z.object({ id: z.uuid(), name: z.string() }),
  })
  .meta({ id: 'ChatMessage' });

const ListMessagesResponseSchema = z
  .object({
    data: z.array(ChatMessageSchema),
    nextCursor: z.uuid().nullable(),
  })
  .meta({ id: 'ListMessagesResponse' });

const EditedMessageSchema = z
  .object({
    id: z.uuid(),
    chatId: z.uuid(),
    content: z.string(),
    contentStatus: ContentStatusSchema,
    editedAt: z.iso.datetime().nullable().meta({
      description: 'null quando o conteúdo enviado é igual ao de uma Message nunca editada',
    }),
  })
  .meta({ id: 'EditedMessage' });

const MessagePathSchema = DeleteMessageSchema;

export const messagesPaths: ZodOpenApiPathsObject = {
  '/chats/{id}/messages': {
    get: {
      tags: ['Messages'],
      summary: 'Lista as Messages de um Chat, da mais recente para a mais antiga',
      description:
        'Messages apagadas continuam no histórico, com content null e contentStatus deleted.',
      security: [{ bearerAuth: [] }],
      requestParams: {
        path: z.object({ id: ListMessagesSchema.shape.chatId }),
        query: ListMessagesSchema.omit({ chatId: true }),
      },
      responses: {
        '200': {
          description: 'Página de Messages',
          content: { 'application/json': { schema: ListMessagesResponseSchema } },
        },
        '400': errorResponse('Chat, limite ou cursor inválido'),
        '401': errorResponse('Token ausente ou inválido'),
        '404': errorResponse('Chat inexistente ou o User não é Participant'),
        '500': errorResponse('Erro interno'),
      },
    },
    post: {
      tags: ['Messages'],
      summary: 'Envia uma Message a um Chat de que o User é Participant',
      description:
        'A Message é publicada no broker e gravada de forma assíncrona. A resposta chega depois do confirm do broker (Published); a gravação (Persisted) chega pelo WebSocket.',
      security: [{ bearerAuth: [] }],
      requestParams: { path: SendMessageSchema.pick({ id: true }) },
      requestBody: {
        content: { 'application/json': { schema: SendMessageSchema.pick({ content: true }) } },
      },
      responses: {
        '201': {
          description: 'Message publicada',
          content: { 'application/json': { schema: SentMessageSchema } },
        },
        '400': errorResponse('Chat inválido ou Message vazia ou com mais de 1000 caracteres'),
        '401': errorResponse('Token ausente ou inválido, ou Sender Deactivated'),
        '403': errorResponse('Direct Chat somente leitura'),
        '404': errorResponse('Chat inexistente ou o User não é Participant'),
        '500': errorResponse('Erro interno'),
        '503': errorResponse('Broker indisponível, a Message não foi enviada'),
      },
    },
  },
  '/chats/{chatId}/messages/{id}': {
    patch: {
      tags: ['Messages'],
      summary: 'Edita o conteúdo de uma Message Persisted do próprio Sender',
      description:
        'Grava a edição no banco e publica message.edited para todos os Participants. Se a Message é a Last Message, o preview do Chat também muda. Enviar o mesmo conteúdo não altera nada nem publica evento. Uma Message ainda não Persisted responde 404.',
      security: [{ bearerAuth: [] }],
      requestParams: { path: MessagePathSchema },
      requestBody: {
        content: { 'application/json': { schema: EditMessageSchema.pick({ content: true }) } },
      },
      responses: {
        '200': {
          description: 'Message editada',
          content: { 'application/json': { schema: EditedMessageSchema } },
        },
        '400': errorResponse(
          'Chat ou Message inválido, ou conteúdo vazio ou com mais de 1000 caracteres',
        ),
        '401': errorResponse('Token ausente ou inválido, ou Sender Deactivated'),
        '403': errorResponse('Direct Chat somente leitura ou o User não é o Sender'),
        '404': errorResponse('Chat inexistente, User não é Participant ou Message não Persisted'),
        '409': errorResponse('Message apagada'),
        '500': errorResponse('Erro interno'),
      },
    },
    delete: {
      tags: ['Messages'],
      summary: 'Apaga uma Message Persisted do próprio Sender',
      description:
        'A Message continua no histórico com content null e contentStatus deleted, e é publicado message.deleted para todos os Participants. Se a Message é a Last Message, o Chat mantém a posição na lista e o preview fica null. Uma Message ainda não Persisted responde 404.',
      security: [{ bearerAuth: [] }],
      requestParams: { path: MessagePathSchema },
      responses: {
        '204': { description: 'Message apagada' },
        '400': errorResponse('Chat ou Message inválido'),
        '401': errorResponse('Token ausente ou inválido, ou Sender Deactivated'),
        '403': errorResponse('Direct Chat somente leitura ou o User não é o Sender'),
        '404': errorResponse('Chat inexistente, User não é Participant ou Message não Persisted'),
        '409': errorResponse('Message já apagada'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
};
