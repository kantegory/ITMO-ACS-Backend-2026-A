import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import SETTINGS from '../config/settings';

interface RequestWithUser extends Request {
    user: any;
}

const authMiddleware = (
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

        const decodedPayload = jwt.verify(
            accessToken,
            SETTINGS.JWT_SECRET_KEY,
        ) as any;

        request.user = decodedPayload;

        next();
    } catch (error) {
        console.error(error);
        return response
            .status(403)
            .send({ message: 'Forbidden: token is invalid or expired' });
    }
};

export { RequestWithUser };
export default authMiddleware;
