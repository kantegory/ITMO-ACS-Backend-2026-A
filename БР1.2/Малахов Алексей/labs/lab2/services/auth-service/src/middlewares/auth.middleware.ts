import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import SETTINGS from '../config/settings';

interface JwtPayloadWithUser extends JwtPayload {
    user: any;
}

export interface RequestWithUser extends Request {
    user: any;
}

const authMiddleware = (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
        const [, token] = (req.headers.authorization || '').split(' ');
        if (!token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'No token provided' });
        const { user } = jwt.verify(token, SETTINGS.JWT_SECRET_KEY) as JwtPayloadWithUser;
        req.user = user;
        next();
    } catch {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Token is invalid or expired' });
    }
};

export default authMiddleware;
