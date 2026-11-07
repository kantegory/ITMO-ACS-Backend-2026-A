"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const typeorm_1 = require("typeorm");
const httpError_1 = require("../utils/httpError");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof httpError_1.HttpError) {
        res.status(err.status).json({
            code: err.code,
            message: err.message,
            ...(err.details ? { errors: err.details } : {}),
        });
        return;
    }
    if (err instanceof typeorm_1.QueryFailedError) {
        // нарушение unique-ограничения PostgreSQL
        if (err.code === '23505') {
            res.status(409).json({ code: 'CONFLICT', message: 'Запись с такими данными уже существует' });
            return;
        }
    }
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (_req, res) => {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Эндпоинт не найден' });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map