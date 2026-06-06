import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      throw new AppError(401, 'No access token');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role: string;
    };

    req.user = {
      sub: payload.sub,
      role: payload.role,
    };

    next();
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}