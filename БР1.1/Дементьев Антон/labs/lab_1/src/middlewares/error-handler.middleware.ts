import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator';

import { ApiError, FieldError } from '../common/errors';
import { RequestWithId } from './request-id.middleware';

// Русские сообщения для стандартных проверок class-validator
const MESSAGES: Record<string, string> = {
    isEmail: 'Некорректный формат email',
    isNotEmpty: 'Поле обязательно для заполнения',
    isDefined: 'Поле обязательно для заполнения',
    isString: 'Значение должно быть строкой',
    minLength: 'Значение слишком короткое',
    maxLength: 'Значение слишком длинное',
    isIn: 'Недопустимое значение',
    isEnum: 'Недопустимое значение',
    isUuid: 'Некорректный идентификатор (ожидается UUID)',
    isInt: 'Значение должно быть целым числом',
    isNumber: 'Значение должно быть числом',
    min: 'Значение слишком мало',
    max: 'Значение слишком велико',
    isBoolean: 'Значение должно быть true или false',
    isArray: 'Значение должно быть массивом',
    arrayMaxSize: 'Слишком много элементов',
    isISO8601: 'Некорректная дата (ожидается формат ГГГГ-ММ-ДД)',
};

// Превращает вложенные ошибки class-validator в плоский список {field, message}
const flatten = (errors: ValidationError[], prefix = ''): FieldError[] =>
    errors.flatMap((e) => {
        const path = prefix ? `${prefix}.${e.property}` : e.property;
        const own: FieldError[] = e.constraints
            ? Object.entries(e.constraints)
                  .slice(0, 1)
                  .map(([key, value]) => ({
                      field: path,
                      // для matches сообщение мы задаём сами в DTO
                      message: key === 'matches' ? value : MESSAGES[key] || value,
                  }))
            : [];
        return [...own, ...flatten(e.children || [], path)];
    });

const send = (
    request: RequestWithId,
    response: Response,
    status: number,
    code: string,
    message: string,
    details?: FieldError[],
) => {
    response.status(status).json({
        code,
        message,
        ...(details && details.length ? { details } : {}),
        request_id: request.requestId,
    });
};

// Единая точка обработки ошибок: любая ошибка превращается в ErrorResponse из ДЗ 2.
export const errorHandler = (
    error: any,
    request: RequestWithId,
    response: Response,
    _next: NextFunction,
) => {
    // ответ уже отправлен (например, контроллер сам вернул 201/204): добавить нечего
    if (response.headersSent) return;

    // наши «ожидаемые» ошибки (нет прав, не найдено, конфликт и т.д.)
    if (error instanceof ApiError) {
        return send(request, response, error.status, error.code, error.message, error.details);
    }

    // ошибки валидации DTO (class-validator внутри routing-controllers)
    if (
        Array.isArray(error?.errors) &&
        error.errors.length > 0 &&
        error.errors[0] instanceof ValidationError
    ) {
        return send(request, response, 422, 'VALIDATION_ERROR', 'Ошибка валидации данных', flatten(error.errors));
    }

    // некорректный JSON в теле запроса и прочие «плохие запросы»
    if (error?.type === 'entity.parse.failed' || error?.status === 400 || error?.httpCode === 400) {
        return send(request, response, 400, 'BAD_REQUEST', 'Некорректный запрос');
    }

    // всё остальное — непредвиденная ошибка сервера
    console.error(`[${request.requestId}]`, error);
    return send(request, response, 500, 'INTERNAL_ERROR', 'Внутренняя ошибка сервера');
};

// Запрос на несуществующий адрес
export const notFoundHandler = (request: Request, response: Response) => {
    // если контроллер уже ответил, сюда доходить не нужно
    if (response.headersSent) return;
    send(request as RequestWithId, response, 404, 'NOT_FOUND', 'Адрес не найден');
};
