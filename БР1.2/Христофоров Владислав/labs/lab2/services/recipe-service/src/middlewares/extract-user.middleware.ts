import { Request, Response, NextFunction } from 'express';

export function extractUserMiddleware(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userId) {
        (req as any).user = {
            id: userId as string,
            role: userRole as string || 'user'
        };
    }
    
    next();
}