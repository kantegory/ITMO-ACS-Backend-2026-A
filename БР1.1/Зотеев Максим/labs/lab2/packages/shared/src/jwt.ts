import jwt, { SignOptions } from "jsonwebtoken";

export type UserRole = "tenant" | "landlord";

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface JwtOptions {
  secret: string;
  expiresIn?: number;
}

export interface Jwt {
  sign(payload: JwtPayload): string;
  verify(token: string): JwtPayload;
}

export const createJwt = ({ secret, expiresIn }: JwtOptions): Jwt => {
  const signOptions: SignOptions = expiresIn !== undefined ? { expiresIn } : {};
  return {
    sign: (payload) => jwt.sign(payload, secret, signOptions),
    verify: (token) => jwt.verify(token, secret) as JwtPayload,
  };
};
