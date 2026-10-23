import { ERRORS } from './errors.table';

export type ErrorCode = keyof typeof ERRORS;
export interface FieldError { field: string; message: string }

// Ошибка API: статус, код и сообщение берутся из каталога ошибок (ДЗ 2 + внутренние коды из ДЗ 4)
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
export const fail = (code: ErrorCode, message?: string) => new ApiError(code, undefined, message);
export const invalid = (field: string, message: string) => new ApiError('VALIDATION_ERROR', [{ field, message }]);
