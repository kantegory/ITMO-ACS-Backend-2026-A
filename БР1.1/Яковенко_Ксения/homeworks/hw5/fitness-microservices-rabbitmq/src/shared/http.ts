import { NextFunction, Request, RequestHandler, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'REQUEST_FAILED',
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const asyncHandler =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  console.error(error);
  response.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message });
}

export function notFoundHandler(request: Request, response: Response): void {
  response.status(404).json({
    error: 'ROUTE_NOT_FOUND',
    message: `Route ${request.method} ${request.originalUrl} was not found`,
  });
}

export function parsePositiveInt(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(422, `${fieldName} must be a positive integer`, 'VALIDATION_ERROR');
  }
  return parsed;
}

export function parseOptionalPositiveInt(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return parsePositiveInt(value, fieldName);
}

export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(422, `${fieldName} is required`, 'VALIDATION_ERROR');
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new HttpError(422, 'Expected a string value', 'VALIDATION_ERROR');
  }
  return value;
}

export function pagination(query: Request['query']): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize };
}
