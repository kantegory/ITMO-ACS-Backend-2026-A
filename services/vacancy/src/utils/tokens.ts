import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = { userId: string; role: string };

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.accessTokenSecret) as JwtPayload;
}
