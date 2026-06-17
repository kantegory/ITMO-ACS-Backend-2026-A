import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ApiErrorResponseDto {
    @IsInt()
    @Type(() => Number)
    statusCode: number;

    @IsString()
    @Type(() => String)
    error: string;

    @IsString()
    @Type(() => String)
    message: string;

    @IsString()
    @Type(() => String)
    path: string;

    @IsString()
    @Type(() => String)
    timestamp: string;
}

function getErrorName(statusCode: number): string {
    if (statusCode === 400) return 'Bad Request';
    if (statusCode === 401) return 'Unauthorized';
    if (statusCode === 403) return 'Forbidden';
    if (statusCode === 404) return 'Not Found';
    if (statusCode === 409) return 'Conflict';
    return 'Internal Server Error';
}

function formatErrorResponse(
    statusCode: number,
    message: string,
    path: string,
    errors?: unknown,
) {
    return {
        statusCode,
        error: getErrorName(statusCode),
        message,
        path,
        timestamp: new Date().toISOString(),
        ...(errors ? { errors } : {}),
    };
}

export { ApiErrorResponseDto, formatErrorResponse };
