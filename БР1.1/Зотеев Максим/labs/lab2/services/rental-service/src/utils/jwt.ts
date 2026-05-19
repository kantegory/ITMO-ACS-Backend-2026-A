import jwt from "jsonwebtoken";
import { config } from "../config";

export interface JwtPayload {
  sub: string;
  role: "tenant" | "landlord";
}

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwt.secret) as JwtPayload;
