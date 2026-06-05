import { Request, Response, NextFunction } from 'express';
import SETTINGS from '../config/settings';

const serviceAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-service-token'] !== SETTINGS.SERVICE_TOKEN) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid service token' });
    }
    next();
};

export default serviceAuthMiddleware;
