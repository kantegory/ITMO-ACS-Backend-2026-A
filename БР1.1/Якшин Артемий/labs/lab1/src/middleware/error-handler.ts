import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.errorCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
};
