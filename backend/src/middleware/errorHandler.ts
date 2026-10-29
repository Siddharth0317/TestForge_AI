import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Array<{ field?: string; message: string }>;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
  const message = statusCode === 500 ? 'An unexpected internal error occurred.' : err.message;

  logger.error({
    err,
    requestId: req.id,
    method: req.method,
    url: req.url,
    statusCode
  }, 'Request error encountered');

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      request_id: req.id || 'unknown',
      details: err.details || [],
      timestamp: new Date().toISOString()
    }
  });
}

