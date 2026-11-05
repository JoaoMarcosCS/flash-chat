import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { LoginSchema } from '@/modules/auth/usecase/login/login.schema';
import { errorResponse } from '../common/error.docs';

const AccessTokenSchema = z
  .object({
    accessToken: z.string().meta({ description: 'JWT com sub, name e nickname' }),
  })
  .meta({ id: 'AccessToken' });

const accessTokenContent = { 'application/json': { schema: AccessTokenSchema } };

export const authPaths: ZodOpenApiPathsObject = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Autentica um User Active por e-mail e senha',
      description:
        'Devolve o access token no corpo e grava o refresh token no cookie httpOnly refreshToken (path /api/v1/auth).',
      requestBody: {
        content: {
          'application/json': {
            schema: LoginSchema,
            example: { email: 'joao@email.com', password: 'Senha@123' },
          },
        },
      },
      responses: {
        '200': { description: 'User autenticado', content: accessTokenContent },
        '400': errorResponse('E-mail inválido ou senha vazia ou com mais de 15 caracteres'),
        '401': errorResponse('Credenciais inválidas'),
        '429': errorResponse('Mais de 10 tentativas em 15 minutos'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Troca o refresh token por um novo par de tokens',
      description:
        'Lê o refresh token do cookie refreshToken, devolve um novo access token e grava um novo refresh token no cookie. O refresh token anterior deixa de valer.',
      security: [{ refreshTokenCookie: [] }],
      responses: {
        '200': { description: 'Sessão renovada', content: accessTokenContent },
        '400': errorResponse('Refresh token é obrigatório'),
        '401': errorResponse('Refresh token inválido, sessão encerrada ou User Deactivated'),
        '500': errorResponse('Erro interno'),
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Encerra a sessão do refresh token',
      description:
        'Apaga o cookie refreshToken e, se o refresh token for válido, encerra a sessão. Responde 204 mesmo sem cookie.',
      security: [{ refreshTokenCookie: [] }, {}],
      responses: {
        '204': { description: 'Sessão encerrada' },
        '500': errorResponse('Erro interno'),
      },
    },
  },
};
