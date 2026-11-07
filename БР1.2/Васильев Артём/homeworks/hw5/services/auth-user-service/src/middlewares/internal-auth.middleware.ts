import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from 'routing-controllers';

import SETTINGS from '../config/settings';

export default function internalAuthMiddleware(
    request: Request,
    _response: Response,
    next: NextFunction,
) {
    const token = request.header('X-Service-Token');

    if (!token || token !== SETTINGS.SERVICE_TOKEN) {
        next(new UnauthorizedError('Invalid service token'));
        return;
    }

    next();
}
