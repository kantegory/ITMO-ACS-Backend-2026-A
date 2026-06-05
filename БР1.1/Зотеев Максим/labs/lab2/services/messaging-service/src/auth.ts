import { createJwt, createAuth } from "@rental/shared";
import { config } from "./config";

const jwt = createJwt({ secret: config.jwt.secret });

export const { authRequired, internalAuth } = createAuth({
  jwt,
  internalToken: config.internalToken,
});
