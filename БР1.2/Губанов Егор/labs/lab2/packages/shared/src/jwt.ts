import jwt from "jsonwebtoken";
import { Role } from "./types";

const secret = () => process.env.JWT_SECRET || "dev";

export function signAccess(userId: string, role: Role) {
  return jwt.sign({ sub: userId, role }, secret(), { expiresIn: "7d" });
}

export function verifyAccess(token: string): { sub: string; role: Role } {
  return jwt.verify(token, secret()) as { sub: string; role: Role };
}
