import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config';


export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
            message: 'JWT-токен не предоставлен',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, config.jwtSecret) as { 
            currentUserId: number,
            userRole: string
        };
        req.headers[config.xUserId] = String(decoded.currentUserId);
        req.headers[config.xUserRole] = decoded.userRole;
        next();
    } catch (error) {
        res.status(401).json({ 
            message: 'Недействительный JWT-токен' 
        });
    }
}
