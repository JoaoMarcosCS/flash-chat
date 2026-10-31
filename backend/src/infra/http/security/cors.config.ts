import { CorsOptions } from 'cors';
import { ForbiddenException } from '@/shared/errors/errors';
import { whiteList } from './white-list';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whiteList.includes(origin)) {
      return callback(null, true);
    }
    return callback(new ForbiddenException('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};
