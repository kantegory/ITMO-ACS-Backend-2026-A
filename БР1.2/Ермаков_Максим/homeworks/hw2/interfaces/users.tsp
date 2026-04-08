import "@typespec/http";
import "../models/user.tsp";
import "../models/error.tsp";

using Http;

namespace RestaurantBookingApi;

@route("/api/v1/users")
@tag("Users")
interface UsersApi {
  @get
  @route("/me")
  getProfile(@header("Authorization") authorization: string): UserProfileResponse | UnauthorizedError | ServerError;

  @patch(#{implicitOptionality: true})
  @route("/me")
  updateProfile(
    @header("Authorization") authorization: string,
    @body body: UpdateUserProfileRequest
  ): UserProfileResponse | UnauthorizedError | ConflictError | ValidationError | ServerError;
}
