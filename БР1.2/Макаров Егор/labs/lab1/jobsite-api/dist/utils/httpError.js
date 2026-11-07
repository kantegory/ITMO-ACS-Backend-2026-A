"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
class HttpError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
    static badRequest(message = 'Некорректный запрос') {
        return new HttpError(400, 'BAD_REQUEST', message);
    }
    static unauthorized(message = 'Требуется авторизация') {
        return new HttpError(401, 'UNAUTHORIZED', message);
    }
    static forbidden(message = 'Недостаточно прав для выполнения операции') {
        return new HttpError(403, 'FORBIDDEN', message);
    }
    static notFound(message = 'Ресурс не найден') {
        return new HttpError(404, 'NOT_FOUND', message);
    }
    static conflict(message = 'Конфликт данных') {
        return new HttpError(409, 'CONFLICT', message);
    }
    static validation(message = 'Ошибка валидации', details) {
        return new HttpError(422, 'VALIDATION_ERROR', message, details);
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=httpError.js.map