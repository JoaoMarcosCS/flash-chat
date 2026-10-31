import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import { pinoInstance } from '@/infra/logger/pino';
import { requestContext } from '@/infra/logger/request-context';

const REQUEST_ID_PATTERN = /^[\w-]{1,64}$/;

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.header('x-request-id');
  const reqId = header && REQUEST_ID_PATTERN.test(header) ? header : randomUUID();

  res.setHeader('X-Request-Id', reqId);
  requestContext.run({ reqId }, next);
};

export const httpLogger = pinoHttp({
  logger: pinoInstance,
  genReqId: () => requestContext.getStore()?.reqId ?? randomUUID(),
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
