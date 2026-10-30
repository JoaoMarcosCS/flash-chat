import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { SendMessageSchema } from '@/modules/messages/usecase/send/send-message.schema';
import { errorResponse } from '../common/error.docs';

const SentMessageSchema = z
  .object({
    id: z.uuid().meta({ description: 'UUIDv7 gerado no mesmo instante do createdAt' }),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'SentMessage' });

export const messagesPaths: ZodOpenApiPathsObject = {
  '/chats/{id}/messages': {
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
};
