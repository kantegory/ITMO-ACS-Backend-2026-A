import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator';

import { ApiError, FieldError } from './errors';
import { als } from './context';
import { isUuid } from './validators';

export interface RequestWithId extends Request { requestId?: string }

// Берёт X-Request-Id из запроса (его выставляет шлюз) или создаёт новый
export const requestIdMiddleware = (req: RequestWithId, res: Response, next: NextFunction) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && isUuid(incoming) ? incoming : randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    als.run({ requestId: id }, () => next());
};

const MESSAGES: Record<string, string> = {
    isEmail: 'Некорректный формат email', isNotEmpty: 'Поле обязательно для заполнения', isDefined: 'Поле обязательно для заполнения',
    isString: 'Значение должно быть строкой', minLength: 'Значение слишком короткое', maxLength: 'Значение слишком длинное',
    isIn: 'Недопустимое значение', isEnum: 'Недопустимое значение', isUuid: 'Некорректный идентификатор (ожидается UUID)',
    isInt: 'Значение должно быть целым числом', isNumber: 'Значение должно быть числом', min: 'Значение слишком мало', max: 'Значение слишком велико',
    isBoolean: 'Значение должно быть true или false', isArray: 'Значение должно быть массивом', arrayMaxSize: 'Слишком много элементов',
    arrayMinSize: 'Слишком мало элементов', isISO8601: 'Некорректная дата (ожидается формат ГГГГ-ММ-ДД)',
};
const flatten = (errors: ValidationError[], prefix = ''): FieldError[] =>
    errors.flatMap((e) => {
        const path = prefix ? `${prefix}.${e.property}` : e.property;
        const own: FieldError[] = e.constraints
            ? Object.entries(e.constraints).slice(0, 1).map(([key, value]) => ({ field: path, message: key === 'matches' ? value : MESSAGES[key] || value }))
            : [];
        return [...own, ...flatten(e.children || [], path)];
    });

const send = (req: RequestWithId, res: Response, status: number, code: string, message: string, details?: FieldError[]) => {
    res.status(status).json({ code, message, ...(details && details.length ? { details } : {}), request_id: req.requestId });
};

export const errorHandler = (error: any, req: RequestWithId, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    if (error instanceof ApiError) return send(req, res, error.status, error.code, error.message, error.details);
    if (Array.isArray(error?.errors) && error.errors.length > 0 && error.errors[0] instanceof ValidationError) {
        return send(req, res, 422, 'VALIDATION_ERROR', 'Ошибка валидации данных', flatten(error.errors));
    }
    if (error?.type === 'entity.parse.failed' || error?.status === 400 || error?.httpCode === 400) {
        return send(req, res, 400, 'BAD_REQUEST', 'Некорректный запрос');
    }
    console.error(`[${req.requestId}]`, error);
    return send(req, res, 500, 'INTERNAL_ERROR', 'Внутренняя ошибка сервера');
};

export const notFoundHandler = (req: Request, res: Response) => {
    if (res.headersSent) return;
    send(req as RequestWithId, res, 404, 'NOT_FOUND', 'Адрес не найден');
};
