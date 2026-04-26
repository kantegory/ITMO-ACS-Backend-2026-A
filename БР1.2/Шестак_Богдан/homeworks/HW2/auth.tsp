import "@typespec/http";

using TypeSpec.Http;
using JobSearchAPI;

@route("/auth")
namespace JobSearchAPI.Auth {

  model RegisterRequest {
    email: string;
    password: string;
    role: UserRole;
    first_name?: string;
    last_name?: string;
  }

  model RegisterResponse {
    user: UserProfile;
    tokens: TokenPair;
  }

  model LoginRequest {
    email: string;
    password: string;
  }

  model LoginResponse {
    user: UserProfile;
    tokens: TokenPair;
  }

  model RefreshRequest {
    refresh_token: string;
  }

  @post
  @route("/register")
  @summary("Регистрация пользователя")
  op register(@body body: RegisterRequest):
    | { @statusCode statusCode: 201; @body body: RegisterResponse; }
    | { @statusCode statusCode: 409; @body body: ApiError; }
    | { @statusCode statusCode: 422; @body body: ApiError; };

  @post
  @route("/login")
  @summary("Вход в систему")
  op login(@body body: LoginRequest):
    | { @statusCode statusCode: 200; @body body: LoginResponse; }
    | { @statusCode statusCode: 401; @body body: ApiError; };

  @post
  @route("/refresh")
  @summary("Обновление access-токена")
  op refresh(@body body: RefreshRequest):
    | { @statusCode statusCode: 200; @body body: TokenPair; }
    | { @statusCode statusCode: 401; @body body: ApiError; };

  @post
  @route("/logout")
  @summary("Выход из системы")
  op logout():
    | { @statusCode statusCode: 204; }
    | { @statusCode statusCode: 401; @body body: ApiError; };
}
