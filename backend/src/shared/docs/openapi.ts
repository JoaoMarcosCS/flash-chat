import { createDocument } from 'zod-openapi';
import { env } from '@/shared/environment/env';
import { authPaths } from './auth/auth.docs';
import { usersPaths } from './users/users.docs';
import { chatsPaths } from './chats/chats.docs';
import { messagesPaths } from './messages/messages.docs';

export const openApiDocument = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Flash Chat API',
    version: '1.0.0',
  },
  servers: [{ url: `http://localhost:${env.API_PORT}/api/v1` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshTokenCookie: { type: 'apiKey', in: 'cookie', name: 'refreshToken' },
    },
  },
  paths: {
    ...authPaths,
    ...usersPaths,
    ...chatsPaths,
    ...messagesPaths,
  },
});
