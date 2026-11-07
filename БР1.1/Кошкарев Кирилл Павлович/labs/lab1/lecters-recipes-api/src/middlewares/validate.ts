import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

/** Проверяет часть запроса по zod-схеме и подменяет её разобранным значением. */
export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      next(badRequest('Проверьте корректность переданных данных', details));
      return;
    }
    if (source === 'query') {
      // req.query в Express 4 — геттер, поэтому кладём результат отдельно
      (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    } else {
      req[source] = result.data as never;
    }
    next();
  };

/** Возвращает провалидированный query (или исходный, если валидация не применялась). */
export const validatedQuery = <T>(req: Request): T =>
  ((req as Request & { validatedQuery?: unknown }).validatedQuery ?? req.query) as T;
