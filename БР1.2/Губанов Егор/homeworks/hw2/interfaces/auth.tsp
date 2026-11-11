import "@typespec/http";
import "../models/error.tsp";
import "../models/rental.tsp";

using Http;

namespace RentService;

@route("/api/v1/auth")
@tag("Auth")
interface AuthPublic {
  @post
  @route("/register")
  register(@body body: RegisterBody): AuthOk | ConflictError | ValidationError | ServerError;

  @post
  @route("/login")
  login(@body body: LoginBody): AuthOk | UnauthorizedError | ValidationError | ServerError;

  @post
  @route("/password/request-reset")
  requestReset(@body body: RequestResetBody): SimpleOk | ValidationError | ServerError;

  @post
  @route("/password/reset")
  resetPassword(@body body: ResetPasswordBody): SimpleOk | ValidationError | UnauthorizedError | ServerError;

  @post
  @route("/refresh")
  refresh(@body body: RefreshBody): AuthOk | UnauthorizedError | ValidationError | ServerError;
}

@useAuth(BearerAuth)
@route("/api/v1/auth")
@tag("Auth")
interface AuthSession {
  @post
  @route("/logout")
  logout(): void | UnauthorizedError | ServerError;
}
