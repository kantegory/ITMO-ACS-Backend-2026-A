import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

  @tag("Users")
  interface Users {

    @get
    @route("/users/me")
    getMyProfile(): {
      user: User;
      profile: UserProfile;
    };

    @patch
    @route("/users/me/profile")
    updateProfile(@body request: UpdateProfileRequest): UserProfile;

    @put
    @route("/users/me/password")
    changePassword(@body request: ChangePasswordRequest): void;
  }
}