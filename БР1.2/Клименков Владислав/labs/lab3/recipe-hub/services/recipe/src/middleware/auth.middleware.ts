import type { Request, Response, NextFunction } from 'express';

import { config } from '../config';


export interface AuthRequest extends Request {
    currentUserId?: number;
}


export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const currentUserId = req.headers[config.xUserId];
    if (currentUserId) {
        req.currentUserId = Number(currentUserId);
        next();
    } else {
        res.status(500).json({ 
            message: 'user-service: Нет заголовка x-user-id' 
        });
    }
}


export const isAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const userRole = req.headers[config.xUserRole];
    if (userRole != "admin") {
        res.status(403).json({
            message: "Доступ только для администраторов"
        })
        return;
    };
    next();
}
