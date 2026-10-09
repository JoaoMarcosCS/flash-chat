import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { CreateUserSchema } from '@/modules/users/usecase/create/create-user.schema';
import { SearchUsersSchema } from '@/modules/users/usecase/search/search-users.schema';
import { errorResponse } from '../common/error.docs';

const UserSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    nickname: z.string(),
    status: z.union([z.literal(1), z.literal(2)]).meta({
      description: '1 = Active, 2 = Deactivated',
    }),
  })
  .meta({ id: 'User' });

const SearchUsersResponseSchema = z
  .object({
    data: z.array(UserSchema),
    nextCursor: z.uuid().nullable(),
  })
  .meta({ id: 'SearchUsersResponse' });

export const usersPaths: ZodOpenApiPathsObject = {
  '/users': {
    get: {
      tags: ['Users'],
      summary: 'Busca usuários ativos por nome ou nickname com paginação por cursor',
      security: [{ bearerAuth: [] }],
      requestParams: { query: SearchUsersSchema },
      responses: {
        '200': {
          description: 'Página de usuários',
          content: { 'application/json': { schema: SearchUsersResponseSchema } },
        },
        '400': errorResponse('Parâmetros inválidos ou cursor inválido'),
        '401': errorResponse('Token ausente ou inválido'),
        '500': errorResponse('Erro interno'),
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Cria um usuário',
      requestBody: {
        content: {
          'application/json': {
            schema: CreateUserSchema,
            example: {
              name: 'João Silva',
              nickname: 'joao.silva',
              email: 'joao@email.com',
              password: 'Senha@123',
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Usuário criado',
          content: { 'application/json': { schema: UserSchema } },
        },
        '400': errorResponse('Dados inválidos'),
        '409': errorResponse('E-mail ou nickname já cadastrado'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
};
