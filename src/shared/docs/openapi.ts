import { createDocument } from 'zod-openapi';
import { env } from '@/shared/environment/env';
import { usersPaths } from './users/users.docs';
import { chatsPaths } from './chats/chats.docs';

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
    },
  },
  paths: {
    ...usersPaths,
    ...chatsPaths,
  },
});
