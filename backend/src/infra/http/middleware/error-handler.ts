import { AppException } from '@/shared/errors/errors';
import { NextFunction, Request, Response } from 'express';
import { logger as rootLogger } from '@/infra/logger';

const logger = rootLogger.child('ErrorHandler');

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppException) {
    if (error.statusCode >= 500) {
      logger.error(error.message, { err: error });
    }
    return res.status(error.statusCode).json({
      error: {
        type: error.name,
        message: error.message,
      },
    });
  }
  logger.error('Unhandled error', { err: error });
  return res.status(500).json({
    error: {
      type: 'InternalServerError',
      message: 'Internal Server Error',
    },
  });
};
