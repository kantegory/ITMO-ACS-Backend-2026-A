import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

export type JwtPayload = {
  userId: number;
};

export const signAccessToken = (payload: JwtPayload) => {
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtSecret) as JwtPayload;

export const tokenExpiresInSeconds = () => {
  if (config.jwtExpiresIn.endsWith("h")) {
    return Number(config.jwtExpiresIn.slice(0, -1)) * 3600;
  }
  if (config.jwtExpiresIn.endsWith("m")) {
    return Number(config.jwtExpiresIn.slice(0, -1)) * 60;
  }
  return Number(config.jwtExpiresIn) || 3600;
};
