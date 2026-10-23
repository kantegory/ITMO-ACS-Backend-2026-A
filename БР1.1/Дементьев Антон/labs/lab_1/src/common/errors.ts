import { ERRORS } from './errors.table';

export type ErrorCode = keyof typeof ERRORS;

export interface FieldError {
    field: string;
    message: string;
}

// Ошибка API: HTTP-статус, машинный код и сообщение берутся из каталога ошибок (ДЗ 2).
export class ApiError extends Error {
    status: number;
    code: ErrorCode;
    details?: FieldError[];

    constructor(code: ErrorCode, details?: FieldError[], message?: string) {
        super(message || ERRORS[code][1]);
        this.code = code;
        this.status = ERRORS[code][0];
        this.details = details;
    }
}

// fail('VACANCY_NOT_FOUND') -> ошибка 404 с кодом VACANCY_NOT_FOUND
export const fail = (code: ErrorCode, message?: string) =>
    new ApiError(code, undefined, message);

// invalid('email', 'Некорректный формат') -> 422 VALIDATION_ERROR с указанием поля
export const invalid = (field: string, message: string) =>
    new ApiError('VALIDATION_ERROR', [{ field, message }]);
