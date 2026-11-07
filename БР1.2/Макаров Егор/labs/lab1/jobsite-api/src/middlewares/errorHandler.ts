import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { HttpError } from '../utils/httpError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  if (err instanceof QueryFailedError) {
    // нарушение unique-ограничения PostgreSQL
    if ((err as unknown as { code?: string }).code === '23505') {
      res.status(409).json({ code: 'CONFLICT', message: 'Запись с такими данными уже существует' });
      return;
    }
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Эндпоинт не найден' });
};
