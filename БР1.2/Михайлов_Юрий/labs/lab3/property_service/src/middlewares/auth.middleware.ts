import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:8000';

export interface RequestWithUser extends Request {
    user: any;
}

const authMiddleware = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction,
) => {
    const { headers } = request;
    const { authorization } = headers;

    try {
        if (!authorization) {
            return response
                .status(401)
                .send({ message: 'Unauthorized: no token provided' });
        }

        const [, accessToken] = authorization.split(' ');

        if (!accessToken) {
            return response
                .status(401)
                .send({ message: 'Unauthorized: no token provided' });
        }


        const requestBody = { token: accessToken };

        // Отправляем токен на проверку в Auth Service
        const verifyResponse = await fetch(`${AUTH_SERVICE_URL}/api/internal/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: accessToken }),
        });

        const data = await verifyResponse.json();

        if (!data.valid) {
            return response
                .status(401)
                .send({ message: 'Unauthorized: token is invalid or expired' });
        }

        request.user = data.user;

        next();
    } catch (error) {
        console.error('Auth service error:', error);
        return response
            .status(503)
            .send({ message: 'Auth service unavailable' });
    }
};

export default authMiddleware;
