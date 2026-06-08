import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const identityUrl =
            process.env.IDENTITY_SERVICE_URL || 'http://localhost:8001';

        const response = await axios.post(
            `${identityUrl}/internal/users/validate-token`,
            { token },
        );

        req.headers['x-user-id'] = response.data.id;
        req.headers['x-user-role'] = response.data.role;

        next();
    } catch (error: any) {
        console.error(
            '[Gateway] Ошибка валидации токена:',
            error.response?.data?.message || error.message,
        );
        res.status(401).json({
            statusCode: 401,
            message:
                'Недействительный токен авторизации или аккаунт заблокирован',
        });
        return;
    }
};
