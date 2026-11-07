import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../utils/errors';
import { isProduction } from '../config/env';

/** Обработчик несуществующих маршрутов. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Маршрут ${req.method} ${req.originalUrl} не найден` },
  });
};

/** Единая сериализация ошибок API. */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof QueryFailedError) {
    const driverCode = (err as QueryFailedError & { code?: string }).code;
    if (driverCode === '23505') {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Нарушено ограничение уникальности' },
      });
      return;
    }
    if (driverCode === '23503') {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Связанная сущность не найдена' },
      });
      return;
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Тело запроса не является корректным JSON' },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера',
      ...(isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
};
