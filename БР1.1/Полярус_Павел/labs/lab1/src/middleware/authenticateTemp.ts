import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateTemp = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role: string;
      step: string;
    };
    if (payload.step !== 'register') {
      res.status(401).json({ statusCode: 401, message: 'Invalid token type' });
      return;
    }
    req.user = { sub: payload.sub, role: payload.role, step: payload.step };
    next();
  } catch {
    res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
  }
};
