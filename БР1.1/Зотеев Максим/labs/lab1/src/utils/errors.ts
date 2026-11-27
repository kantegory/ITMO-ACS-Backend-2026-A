export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const badRequest = (msg: string, code = "bad_request") => new HttpError(400, code, msg);
export const unauthorized = (msg = "Не авторизован") => new HttpError(401, "unauthorized", msg);
export const forbidden = (msg = "Доступ запрещён") => new HttpError(403, "forbidden", msg);
export const notFound = (msg = "Ресурс не найден") => new HttpError(404, "not_found", msg);
export const conflict = (msg: string, code = "conflict") => new HttpError(409, code, msg);
