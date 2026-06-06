export class AppError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}