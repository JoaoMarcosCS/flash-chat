import { rateLimit } from 'express-rate-limit';
import { env } from '@/shared/environment/env';
import { TooManyRequestsException } from '@/shared/errors/errors';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.ENVIRONMENT === 'test',
  handler: (req, res, next) => {
    next(new TooManyRequestsException('Muitas requisições. Tente novamente mais tarde.'));
  },
});

export const currentPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.user.id,
  skip: () => env.ENVIRONMENT === 'test',
  handler: (req, res, next) => {
    next(new TooManyRequestsException('Muitas requisições. Tente novamente mais tarde.'));
  },
});
