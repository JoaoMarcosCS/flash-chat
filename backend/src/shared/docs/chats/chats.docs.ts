import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { CreateDirectChatSchema } from '@/modules/chats/usecase/create-direct/create-direct-chat.schema';
import { CreateGroupSchema } from '@/modules/chats/usecase/create-group/create-group.schema';
import { GetChatSchema } from '@/modules/chats/usecase/get/get-chat.schema';
import { ListChatsSchema } from '@/modules/chats/usecase/list/list-chats.schema';
import { errorResponse } from '../common/error.docs';

const ChatSchema = z
  .object({
    id: z.uuid(),
    isGroup: z.boolean(),
    title: z.string().nullable().meta({ description: 'Nulo em Direct Chat' }),
    createdBy: z.uuid().meta({ description: 'Initiator, só informativo' }),
    createdAt: z.iso.datetime(),
    readOnly: z.boolean().meta({
      description: 'true só em Direct Chat com um Participant Deactivated',
    }),
    participants: z
      .array(z.object({ id: z.uuid(), name: z.string(), nickname: z.string() }))
      .meta({ description: 'Em ordem alfabética de name' }),
  })
  .meta({ id: 'Chat' });

const ChatListItemSchema = z
  .object({
    id: z.uuid(),
    isGroup: z.boolean(),
    displayName: z.string().meta({
      description: 'title no Group, name do outro Participant no Direct Chat',
    }),
    readOnly: z.boolean(),
    lastMessage: z
      .object({
        id: z.uuid(),
        content: z.string().meta({ description: 'Truncado em 100 caracteres' }),
        sender: z.object({ id: z.uuid(), name: z.string() }),
      })
      .nullable(),
  })
  .meta({ id: 'ChatListItem' });

const ListChatsResponseSchema = z
  .object({
    data: z.array(ChatListItemSchema),
    nextCursor: z.uuid().nullable(),
  })
  .meta({ id: 'ListChatsResponse' });

const chatContent = { 'application/json': { schema: ChatSchema } };

export const chatsPaths: ZodOpenApiPathsObject = {
  '/chats': {
    get: {
      tags: ['Chats'],
      summary: 'Lista os Chats do User, da Last Message mais recente para a mais antiga',
      security: [{ bearerAuth: [] }],
      requestParams: { query: ListChatsSchema },
      responses: {
        '200': {
          description: 'Página de Chats',
          content: { 'application/json': { schema: ListChatsResponseSchema } },
        },
        '400': errorResponse('Busca com menos de 2 caracteres, tipo, limite ou cursor inválido'),
        '401': errorResponse('Token ausente ou inválido'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
  '/chats/direct': {
    post: {
      tags: ['Chats'],
      summary: 'Inicia um Direct Chat ou devolve o existente',
      security: [{ bearerAuth: [] }],
      requestBody: { content: { 'application/json': { schema: CreateDirectChatSchema } } },
      responses: {
        '200': { description: 'Direct Chat já existia', content: chatContent },
        '201': { description: 'Direct Chat criado', content: chatContent },
        '400': errorResponse('Participant inválido ou o próprio User'),
        '401': errorResponse('Token ausente ou inválido'),
        '404': errorResponse('User inexistente ou Deactivated sem Direct Chat existente'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
  '/chats/groups': {
    post: {
      tags: ['Chats'],
      summary: 'Cria um Group com o Initiator e de 2 a 49 Participants',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: CreateGroupSchema,
            example: {
              title: 'Viagem de férias',
              participantIds: [
                '0199b7a0-0000-7000-8000-000000000002',
                '0199b7a0-0000-7000-8000-000000000003',
              ],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Group criado', content: chatContent },
        '400': errorResponse('Título ou Participants inválidos'),
        '401': errorResponse('Token ausente ou inválido'),
        '404': errorResponse('Algum Participant inexistente ou Deactivated'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
  '/chats/{id}': {
    get: {
      tags: ['Chats'],
      summary: 'Abre um Chat de que o User é Participant',
      security: [{ bearerAuth: [] }],
      requestParams: { path: GetChatSchema },
      responses: {
        '200': { description: 'Chat', content: chatContent },
        '400': errorResponse('Chat inválido'),
        '401': errorResponse('Token ausente ou inválido'),
        '404': errorResponse('Chat inexistente ou o User não é Participant'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
};
