export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(m = 'Некорректный запрос') { return new HttpError(400, 'BAD_REQUEST', m); }
  static unauthorized(m = 'Требуется авторизация') { return new HttpError(401, 'UNAUTHORIZED', m); }
  static forbidden(m = 'Недостаточно прав для выполнения операции') { return new HttpError(403, 'FORBIDDEN', m); }
  static notFound(m = 'Ресурс не найден') { return new HttpError(404, 'NOT_FOUND', m); }
  static conflict(m = 'Конфликт данных') { return new HttpError(409, 'CONFLICT', m); }
  static validation(m = 'Ошибка валидации', d?: unknown) { return new HttpError(422, 'VALIDATION_ERROR', m, d); }
  static unavailable(m = 'Сервис временно недоступен') { return new HttpError(503, 'SERVICE_UNAVAILABLE', m); }
}
