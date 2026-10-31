import pino from 'pino';
import { env } from '@/shared/environment/env';
import { requestContext } from './request-context';
import { environmentCheck } from '@/shared/utils/environment-check';

const isPretty = environmentCheck('development') || environmentCheck('test');

export const pinoInstance = pino({
  level: env.LOG_LEVEL,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['password', '*.password', 'req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
  mixin: () => {
    const store = requestContext.getStore();
    return store ? { reqId: store.reqId } : {};
  },
  transport: isPretty
    ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname,context',
          messageFormat: '{if context}[{context}] {end}{msg}',
        },
      }
    : undefined,
});
