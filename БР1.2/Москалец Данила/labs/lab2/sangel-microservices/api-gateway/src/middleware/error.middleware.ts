import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Gateway Error:', err.message);
  res.status(500).json({ error: { code: 500, message: 'Gateway internal error' } });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 404, message: `Route ${req.method} ${req.path} not found` } });
}