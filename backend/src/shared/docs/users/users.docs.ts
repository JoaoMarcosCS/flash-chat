import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { CreateUserSchema } from '@/modules/users/usecase/create/create-user.schema';
import { SearchUsersSchema } from '@/modules/users/usecase/search/search-users.schema';
import { UpdateUserSchema } from '@/modules/users/usecase/update/update-user.schema';
import { DeactivateUserSchema } from '@/modules/users/usecase/deactivate/deactivate-user.schema';
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

const UserProfileSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    nickname: z.string(),
    email: z.email(),
  })
  .meta({ id: 'UserProfile' });

const profileContent = { 'application/json': { schema: UserProfileSchema } };

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
        '400': errorResponse('Busca ausente ou com menos de 2 caracteres, ou cursor inválido'),
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
        '429': errorResponse('Mais de 10 tentativas em 15 minutos'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Devolve os dados do User autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Dados do User', content: profileContent },
        '401': errorResponse('Token ausente ou inválido, ou User Deactivated'),
        '500': errorResponse('Erro interno'),
      },
    },
    patch: {
      tags: ['Users'],
      summary: 'Edita name, nickname, e-mail ou senha do User autenticado',
      description:
        'Exige currentPassword e ao menos um campo de edição, com as mesmas regras do cadastro. Não encerra as sessões abertas e não publica evento: o novo valor aparece no próximo fetch.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: UpdateUserSchema,
            example: { nickname: 'joao.silva2', currentPassword: 'Senha@123' },
          },
        },
      },
      responses: {
        '200': { description: 'User editado', content: profileContent },
        '400': errorResponse('Dados inválidos, nenhum campo de edição ou senha atual incorreta'),
        '401': errorResponse('Token ausente ou inválido, ou User Deactivated'),
        '409': errorResponse('E-mail ou nickname já cadastrado, inclusive por User Deactivated'),
        '429': errorResponse('Mais de 10 tentativas sem sucesso em 15 minutos'),
        '500': errorResponse('Erro interno'),
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Desativa o User autenticado, sem volta',
      description:
        'Exige currentPassword. Apaga o cookie refreshToken, publica user.deactivated para os Participants dos Chats do User e o servidor WebSocket fecha as conexões dele com o código 4003. O access token em uso vale até expirar, mas o refresh passa a responder 401.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: DeactivateUserSchema,
            example: { currentPassword: 'Senha@123' },
          },
        },
      },
      responses: {
        '204': { description: 'User desativado' },
        '400': errorResponse('Senha atual ausente ou incorreta'),
        '401': errorResponse('Token ausente ou inválido, ou User Deactivated'),
        '429': errorResponse('Mais de 10 tentativas sem sucesso em 15 minutos'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
};
