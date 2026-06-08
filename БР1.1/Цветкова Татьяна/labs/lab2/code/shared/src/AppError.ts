export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") { super(message, 404); }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") { super(message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") { super(message, 403); }
}
export class ConflictError extends AppError {
  constructor(message = "Conflict") { super(message, 409); }
}
export class ValidationError extends AppError {
  constructor(details: unknown, message = "Validation failed") { super(message, 422, details); }
}
