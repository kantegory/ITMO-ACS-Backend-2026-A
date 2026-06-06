import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = { userId: string; role: string };

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.accessTokenSecret, {
    expiresIn: env.accessTokenTtl as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.accessTokenSecret) as JwtPayload;
}

export function newRefreshToken(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(32).toString("base64url");
  const hash = hashRefreshToken(plain);
  return { plain, hash };
}

export function hashRefreshToken(plain: string): string {
  return crypto
    .createHmac("sha256", env.refreshTokenSecret)
    .update(plain)
    .digest("hex");
}
