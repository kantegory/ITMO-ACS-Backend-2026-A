export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: number,
    message: string
  ) {
    super(message);
  }
}

export const E = {
  unauthorized: () => new AppError(401, 401, "Нужно войти"),
  forbidden: () => new AppError(403, 403, "Нельзя так"),
  notFound: () => new AppError(404, 404, "Не нашлось"),
  conflict: () => new AppError(409, 409, "Уже есть или не подходит"),
  validation: (m = "Данные кривые") => new AppError(422, 422, m),
  server: () => new AppError(500, 500, "Сервер упал"),
};
