import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { settings } from '../config/settings';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Публичные маршруты (без аутентификации)
  const publicPaths = ['/health', '/api/v1/auth/register', '/api/v1/auth/login', '/api-docs'];
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 401, message: 'No token provided' } });
  }

  const token = authHeader.substring(7);

  try {
    const response = await axios.post(`${settings.services.user}/internal/validate`, { token });
    req.user = response.data;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: { code: 401, message: 'Invalid or expired token' } });
  }
}