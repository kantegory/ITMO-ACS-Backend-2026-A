export class HttpError extends Error {
  constructor(
    public status: number,
    public errorCode: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const BadRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'Bad Request', message, details);

export const Unauthorized = (message = 'Missing or invalid authorization token') =>
  new HttpError(401, 'Unauthorized', message);

export const Forbidden = (message = "You don't have permission to perform this action") =>
  new HttpError(403, 'Forbidden', message);

export const NotFound = (message = 'Resource not found') =>
  new HttpError(404, 'Not Found', message);

export const Conflict = (message: string) =>
  new HttpError(409, 'Conflict', message);
