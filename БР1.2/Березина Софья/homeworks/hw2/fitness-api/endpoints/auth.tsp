import "../models/index.tsp";

using TypeSpec.Http;

namespace FitnessApi {

    @tag("Authentication")
    interface Auth {
    @post
    @route("/auth/register")
    register(@body request: RegisterRequest): AuthResponse | ErrorResponse;

    @post
    @route("/auth/login")
    login(@body request: LoginRequest): AuthResponse | ErrorResponse;

    @post
    @route("/auth/refresh")
    refresh(@body request: RefreshRequest): {
        access_token: string;
    };

    @post
    @route("/auth/logout")
    logout(): void;
    }
}