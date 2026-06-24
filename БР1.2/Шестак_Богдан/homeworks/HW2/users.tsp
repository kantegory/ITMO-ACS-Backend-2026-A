import "@typespec/http";

using TypeSpec.Http;
using JobSearchAPI;

@route("/users")
namespace JobSearchAPI.Users {

  model UpdateProfileRequest {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }

  model ChangePasswordRequest {
    old_password: string;
    new_password: string;
  }

  @get
  @route("/me")
  @summary("Получить свой профиль")
  op getMe():
    | { @statusCode statusCode: 200; @body body: UserProfile; }
    | { @statusCode statusCode: 401; @body body: ApiError; };

  @patch
  @route("/me")
  @summary("Обновить профиль")
  op updateMe(@body body: UpdateProfileRequest):
    | { @statusCode statusCode: 200; @body body: UserProfile; }
    | { @statusCode statusCode: 401; @body body: ApiError; }
    | { @statusCode statusCode: 422; @body body: ApiError; };

  @put
  @route("/me/password")
  @summary("Сменить пароль")
  op changePassword(@body body: ChangePasswordRequest):
    | { @statusCode statusCode: 204; }
    | { @statusCode statusCode: 400; @body body: ApiError; }
    | { @statusCode statusCode: 401; @body body: ApiError; };
}
