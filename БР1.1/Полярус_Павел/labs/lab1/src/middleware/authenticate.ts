import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.access_token;
  if (!token) {
    res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role: string;
    };
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ statusCode: 401, message: 'Unauthorized' });
  }
};
