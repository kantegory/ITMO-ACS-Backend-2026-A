import jwt from "jsonwebtoken";
import { config } from "../config";

export interface JwtPayload {
  sub: string;
  role: "tenant" | "landlord";
}

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwt.secret) as JwtPayload;
