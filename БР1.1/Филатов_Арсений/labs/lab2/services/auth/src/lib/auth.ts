import type { Prisma } from "../generated/prisma";
import { db } from "../db/client";
import { requireAccessContext } from "@lab2/auth-jwt";

export type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

export const userWithoutPassword = (user: UserWithRole) => {
  const { passwordHash: _, ...rest } = user;
  return rest;
};

export async function getAuthUser(headers: Record<string, string | undefined>) {
  const ctx = await requireAccessContext(headers);
  if (!ctx) return null;

  return db.user.findUnique({
    where: { id: ctx.userId },
    include: { role: true },
  });
}
