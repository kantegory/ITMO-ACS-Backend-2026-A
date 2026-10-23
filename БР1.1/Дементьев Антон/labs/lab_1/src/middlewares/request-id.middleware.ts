import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithId extends Request {
    requestId?: string;
}

// Каждому запросу присваивается уникальный номер (request_id).
// Он попадает в заголовок X-Request-Id и в тело ошибки, чтобы легко искать запрос в логах.
const requestIdMiddleware = (
    request: RequestWithId,
    response: Response,
    next: NextFunction,
) => {
    request.requestId = randomUUID();
    response.setHeader('X-Request-Id', request.requestId);
    next();
};

export default requestIdMiddleware;
