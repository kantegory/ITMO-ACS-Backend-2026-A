import { createJwt, createAuth } from "@rental/shared";
import { config } from "./config";

export const jwt = createJwt({
  secret: config.jwt.secret,
  expiresIn: config.jwt.expiresIn,
});

export const { authRequired, internalAuth } = createAuth({
  jwt,
  internalToken: config.internalToken,
});
