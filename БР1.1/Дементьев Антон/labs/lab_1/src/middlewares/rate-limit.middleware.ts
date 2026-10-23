import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';
import { fail } from '../common/errors';

// Простое ограничение частоты запросов (в памяти сервера):
// не более RATE_LIMIT_MAX запросов за RATE_LIMIT_WINDOW_SECONDS с одного адреса на один путь.
const hits = new Map<string, number[]>();

const rateLimit = (request: Request, response: Response, next: NextFunction) => {
    const windowMs = SETTINGS.RATE_LIMIT_WINDOW_SECONDS * 1000;
    const now = Date.now();
    const key = `${request.ip}:${request.path}`;

    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

    if (recent.length >= SETTINGS.RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
        response.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
        hits.set(key, recent);
        return next(fail('TOO_MANY_REQUESTS'));
    }

    recent.push(now);
    hits.set(key, recent);
    next();
};

export default rateLimit;
