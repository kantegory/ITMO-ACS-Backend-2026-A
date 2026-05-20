export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = () => new AppError(404, "not found");
export const conflict = () => new AppError(409, "already exists");
export const forbidden = () => new AppError(403, "forbidden");
export const badRequest = () => new AppError(400, "invalid input");
export const unauthorized = () => new AppError(401, "invalid credentials");
