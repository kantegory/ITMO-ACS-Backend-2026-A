import jwt from "jsonwebtoken";
import { required } from "../../shared/config";
import { unauthorized } from "../../shared/errors";

const secret = () => {
  const value = required("JWT_SECRET");
  if (value.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  return value;
};
export const tokenExpiresInSeconds = () => 3600;
export const signAccessToken = (payload: { userId: number }) => jwt.sign(payload, secret(), {
  algorithm: "HS256", expiresIn: tokenExpiresInSeconds(), issuer: "restaurant-accounts", audience: "restaurant-api",
});
export const verifyAccessToken = (token: string): { userId: number } => {
  try {
    const payload = jwt.verify(token, secret(), { algorithms: ["HS256"], issuer: "restaurant-accounts", audience: "restaurant-api" });
    if (typeof payload === "string" || !Number.isSafeInteger(payload.userId) || payload.userId < 1) throw unauthorized();
    return { userId: payload.userId };
  } catch { throw unauthorized(); }
};
