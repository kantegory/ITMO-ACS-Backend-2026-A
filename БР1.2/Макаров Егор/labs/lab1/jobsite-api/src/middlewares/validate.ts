import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpError } from '../utils/httpError';

type Part = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, part: Part = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      // перезаписываем разобранными/приведёнными значениями
      (req as unknown as Record<Part, unknown>)[part] = parsed;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const errors = e.errors.map((it) => ({
          field: it.path.join('.') || '(root)',
          message: it.message,
        }));
        throw HttpError.validation('Проверьте корректность переданных полей', errors);
      }
      throw e;
    }
  };
