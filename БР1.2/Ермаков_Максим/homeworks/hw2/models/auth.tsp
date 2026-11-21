import "@typespec/http";
import "./common.tsp";

using Http;

namespace RestaurantBookingApi;

model RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
}

model LoginRequest {
  email: string;
  password: string;
}

model AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: int32;
}

model AuthUser {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

model AuthPayload {
  user: AuthUser;
  tokens: AuthTokenPayload;
}

model RegisterResponse {
  @statusCode statusCode: 201;
  data: AuthPayload;
}

model LoginResponse {
  data: AuthPayload;
}
