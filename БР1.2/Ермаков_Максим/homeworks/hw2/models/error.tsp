import "@typespec/http";

using Http;

namespace RestaurantBookingApi;

model ErrorDetail {
  field?: string;
  issue: string;
}

@error
model BadRequestError {
  @statusCode statusCode: 400;
  code: "BAD_REQUEST";
  message: string;
  details?: ErrorDetail[];
}

@error
model UnauthorizedError {
  @statusCode statusCode: 401;
  code: "UNAUTHORIZED";
  message: string;
}

@error
model ForbiddenError {
  @statusCode statusCode: 403;
  code: "FORBIDDEN";
  message: string;
}

@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "NOT_FOUND";
  message: string;
}

@error
model ConflictError {
  @statusCode statusCode: 409;
  code: "CONFLICT";
  message: string;
}

@error
model ValidationError {
  @statusCode statusCode: 422;
  code: "VALIDATION_ERROR";
  message: string;
  details?: ErrorDetail[];
}

@error
model ServerError {
  @statusCode statusCode: 500;
  code: "SERVER_ERROR";
  message: string;
}
