import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretKey, JWT_ISSUER } from "@lab2/auth-jwt";

const ALG = "HS256" as const;

export async function createRefreshToken(userId: number): Promise<string> {
  const key = getJwtSecretKey();
  return new SignJWT({ token_use: "refresh" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(String(userId))
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .sign(key);
}

export async function verifyRefreshTokenJwt(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      issuer: JWT_ISSUER,
      algorithms: [ALG],
    });
    if (payload.token_use !== "refresh" || typeof payload.sub !== "string") return null;
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
