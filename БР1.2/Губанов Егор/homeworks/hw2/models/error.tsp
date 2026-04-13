@error
model Error {
  code: int32;
  message: string;
}

model UnauthorizedError extends Error {
  code: 401;
  message: "Нужно войти";
}

model ForbiddenError extends Error {
  code: 403;
  message: "Нельзя так";
}

model NotFoundError extends Error {
  code: 404;
  message: "Не нашлось";
}

model ConflictError extends Error {
  code: 409;
  message: "Уже есть или не подходит";
}

model ValidationError extends Error {
  code: 422;
  message: "Данные кривые";
}

model ServerError extends Error {
  code: 500;
  message: "Сервер упал";
}
