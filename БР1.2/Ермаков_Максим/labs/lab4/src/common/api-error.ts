export class ApiError extends Error {
    constructor(
        public httpCode: number,
        public code: string,
        message: string,
        public details?: unknown,
    ) {
        super(message);
    }
}

export const notFound = (code: string, message: string) =>
    new ApiError(404, code, message);

export const conflict = (code: string, message: string) =>
    new ApiError(409, code, message);

export const forbidden = (message = 'You do not have permission to access this resource') =>
    new ApiError(403, 'FORBIDDEN', message);

export const unauthorized = (message = 'Authentication is required') =>
    new ApiError(401, 'UNAUTHORIZED', message);
