import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { settings } from '../config/settings';
import { errorResponse } from '../common/dto';

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
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse(401, 'No token provided'));
  }

  const token = authHeader.substring(7);

  try {
    const response = await axios.post(`${settings.userServiceUrl}/internal/validate`, { token });
    req.user = response.data;
    next();
  } catch (error: any) {
    return res.status(401).json(errorResponse(401, 'Invalid or expired token'));
  }
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(errorResponse(401, 'Unauthorized'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse(403, 'Forbidden: Insufficient permissions'));
    }

    next();
  };
}