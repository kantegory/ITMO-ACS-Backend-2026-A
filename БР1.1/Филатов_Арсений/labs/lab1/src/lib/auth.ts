import type { Prisma } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { db } from "../db/client";

export type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

export const userWithoutPassword = (user: UserWithRole) => {
  const { passwordHash: _, ...rest } = user;
  return rest;
};

const JWT_ISSUER = "lab1-job-search";
const ALG = "HS256" as const;

const getSecretKey = () => {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "JWT_SECRET не задан или короче 32 символов"
    );
  }
  return new TextEncoder().encode(raw);
};

const accessTtlSeconds = () => Number(process.env.JWT_EXPIRES_IN ?? 3600);

export async function createAccessToken(userId: number): Promise<string> {
  const key = getSecretKey();
  const ttl = accessTtlSeconds();
  return new SignJWT({ token_use: "access" })
    .setProtectedHeader({ alg: ALG })
    .setSubject(String(userId))
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + ttl * 1000))
    .sign(key);
}

export async function createRefreshToken(userId: number): Promise<string> {
  const key = getSecretKey();
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
    const { payload } = await jwtVerify(token, getSecretKey(), {
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

export async function getAuthUser(headers: Record<string, string | undefined>) {
  const auth = headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;

  try {
    const { payload } = await jwtVerify(auth.slice(7), getSecretKey(), {
      issuer: JWT_ISSUER,
      algorithms: [ALG],
    });
    if (payload.token_use !== "access" || typeof payload.sub !== "string") return null;
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;

    return db.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
  } catch {
    return null;
  }
}
