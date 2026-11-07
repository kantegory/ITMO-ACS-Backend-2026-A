/** Прикладная ошибка с HTTP-статусом и машиночитаемым кодом. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: Array<{ field: string; message: string }>) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);

export const unauthorized = (message = 'Требуется авторизация') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const invalidCredentials = (message = 'Неверный email или пароль') =>
  new AppError(401, 'INVALID_CREDENTIALS', message);

export const forbidden = (message = 'Недостаточно прав на операцию') =>
  new AppError(403, 'FORBIDDEN', message);

export const notFound = (message = 'Ресурс не найден') =>
  new AppError(404, 'NOT_FOUND', message);

export const conflict = (message = 'Ресурс с такими данными уже существует') =>
  new AppError(409, 'CONFLICT', message);

export const unprocessable = (message: string) =>
  new AppError(422, 'UNPROCESSABLE', message);
