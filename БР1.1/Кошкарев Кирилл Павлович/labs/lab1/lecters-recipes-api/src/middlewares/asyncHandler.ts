import { NextFunction, Request, RequestHandler, Response } from 'express';

/** Оборачивает асинхронный обработчик, пробрасывая ошибки в express-цепочку. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
