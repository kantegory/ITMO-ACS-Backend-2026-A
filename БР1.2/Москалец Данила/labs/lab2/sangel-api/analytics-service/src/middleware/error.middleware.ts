import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../common/dto';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const details: Record<string, unknown> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      details[path] = e.message;
    });
    return res.status(400).json(errorResponse(400, 'Validation failed', details));
  }

  if (err.name === 'QueryFailedError') {
    const message = err.message;
    if (message.includes('duplicate key')) {
      return res.status(409).json(errorResponse(409, 'Duplicate entry', { detail: message }));
    }
    return res.status(400).json(errorResponse(400, 'Database error', { detail: message }));
  }

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json(errorResponse(statusCode, message));
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(errorResponse(404, `Route ${req.method} ${req.path} not found`));
}