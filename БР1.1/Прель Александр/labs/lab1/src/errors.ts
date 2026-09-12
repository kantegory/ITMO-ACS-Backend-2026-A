export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_SERVER_ERROR";

export type ValidationErrorDetail = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ValidationErrorDetail[],
  ) {
    super(message);
  }
}

export const badRequest = (message = "Некорректные параметры запроса.") =>
  new ApiError(400, "BAD_REQUEST", message);

export const unauthorized = (message = "Требуется Bearer JWT или токен недействителен.") =>
  new ApiError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "У пользователя нет прав на выполнение операции.") =>
  new ApiError(403, "FORBIDDEN", message);

export const notFound = (message = "Запрошенный ресурс не найден.") =>
  new ApiError(404, "NOT_FOUND", message);

export const conflict = (message = "Конфликт состояния ресурса.") =>
  new ApiError(409, "CONFLICT", message);

export const validationError = (details: ValidationErrorDetail[]) =>
  new ApiError(422, "VALIDATION_ERROR", "Некоторые поля заполнены некорректно.", details);
