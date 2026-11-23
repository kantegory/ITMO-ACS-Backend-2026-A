import { SignJWT, jwtVerify } from "jose";

export const JWT_ISSUER = "lab2-job-search";
const ALG = "HS256" as const;

export const getJwtSecretKey = () => {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error(
      "JWT_SECRET не задан или короче 32 символов. Укажите в .env (см. .env.example)."
    );
  }
  return new TextEncoder().encode(raw);
};

export async function createAccessToken(userId: number, roleCode: string): Promise<string> {
  const key = getJwtSecretKey();
  const ttl = Number(process.env.JWT_EXPIRES_IN ?? 3600);
  return new SignJWT({ token_use: "access", role: roleCode })
    .setProtectedHeader({ alg: ALG })
    .setSubject(String(userId))
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + ttl * 1000))
    .sign(key);
}

export async function verifyAccessToken(
  token: string
): Promise<{ userId: number; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      issuer: JWT_ISSUER,
      algorithms: [ALG],
    });
    if (payload.token_use !== "access" || typeof payload.sub !== "string") return null;
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;
    const role = typeof payload.role === "string" ? payload.role : null;
    if (!role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

export function getBearerToken(headers: Record<string, string | undefined>): string | null {
  const auth = headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function requireAccessContext(
  headers: Record<string, string | undefined>
): Promise<{ userId: number; role: string } | null> {
  const token = getBearerToken(headers);
  if (!token) return null;
  return verifyAccessToken(token);
}
