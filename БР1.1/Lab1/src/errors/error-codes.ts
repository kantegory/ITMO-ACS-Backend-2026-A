export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const statusToErrorCode = (status: number, hasValidationErrors = false): ErrorCode => {
    if (hasValidationErrors) {
        return ErrorCode.VALIDATION_ERROR;
    }

    switch (status) {
        case 400:
            return ErrorCode.BAD_REQUEST;
        case 401:
            return ErrorCode.UNAUTHORIZED;
        case 403:
            return ErrorCode.FORBIDDEN;
        case 404:
            return ErrorCode.NOT_FOUND;
        case 409:
            return ErrorCode.CONFLICT;
        default:
            return ErrorCode.INTERNAL_ERROR;
    }
};
