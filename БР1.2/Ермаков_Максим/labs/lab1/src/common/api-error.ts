import { HttpError } from 'routing-controllers';

export class ApiError extends HttpError {
    code: string;
    details?: unknown;

    constructor(
        httpCode: number,
        code: string,
        message: string,
        details?: unknown,
    ) {
        super(httpCode, message);
        this.code = code;
        this.details = details;
    }
}
