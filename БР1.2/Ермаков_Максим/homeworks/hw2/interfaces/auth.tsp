import "@typespec/http";
import "../models/auth.tsp";
import "../models/error.tsp";
import "../models/common.tsp";

using Http;

namespace RestaurantBookingApi;

@route("/api/v1/auth")
@tag("Auth")
interface AuthApi {
  @post
  @route("/register")
  register(@body body: RegisterRequest): RegisterResponse | ConflictError | ValidationError | ServerError;

  @post
  @route("/login")
  login(@body body: LoginRequest): LoginResponse | UnauthorizedError | ValidationError | ServerError;

  @post
  @route("/logout")
  logout(@header("Authorization") authorization: string): ActionSuccessResponse | UnauthorizedError | ServerError;
}
