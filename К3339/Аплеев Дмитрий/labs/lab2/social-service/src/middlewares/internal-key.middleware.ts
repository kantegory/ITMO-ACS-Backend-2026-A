import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';

// единая точка входа — bff-service: сервис принимает запросы только от BFF
// и от соседних сервисов. Они передают общий секретный ключ в заголовке
// X-Internal-Key, а клиент этого ключа не знает
const internalKeyMiddleware = (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    // документацию Swagger сервиса оставляем открытой для просмотра
    if (request.path.startsWith('/docs')) {
        next();
        return;
    }

    if (request.headers['x-internal-key'] !== SETTINGS.INTERNAL_API_KEY) {
        response.status(403).send({
            message: 'Forbidden: use bff-service as the entry point',
        });
        return;
    }

    next();
};

export default internalKeyMiddleware;
