import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, Role } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { PasswordResetToken } from "../entities/PasswordResetToken";
import { signAccess } from "../../../../packages/shared/src/jwt";
import { E } from "../../../../packages/shared/src/errors";
import { userPublic } from "../serializers";

const REFRESH_DAYS = 30;
const RESET_HOURS = 24;

function authResponse(user: User, refreshPlain: string) {
  return {
    access_token: signAccess(user.id, user.role),
    refresh_token: refreshPlain,
    token_type: "Bearer",
    user: userPublic(user),
  };
}

async function saveRefresh(userId: string) {
  const repo = AppDataSource.getRepository(RefreshToken);
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_DAYS);
  await repo.save(repo.create({ userId, token, expiresAt }));
  return token;
}

export async function register(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const first_name = String(body.first_name || "").trim();
  const last_name = String(body.last_name || "").trim();
  const role = body.role as Role;
  if (!email || !password || !first_name || !last_name) throw E.validation();
  if (!["TENANT", "OWNER", "ADMIN"].includes(role)) throw E.validation();
  if (password.length < 6) throw E.validation("Данные кривые");
  const userRepo = AppDataSource.getRepository(User);
  if (await userRepo.findOne({ where: { email } })) throw E.conflict();
  const user = userRepo.create({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    firstName: first_name,
    lastName: last_name,
    role,
    isVerified: false,
  });
  await userRepo.save(user);
  const refresh = await saveRefresh(user.id);
  res.json(authResponse(user, refresh));
}

export async function login(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) throw E.validation();
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw E.unauthorized();
  }
  await AppDataSource.getRepository(RefreshToken).delete({ userId: user.id });
  const refresh = await saveRefresh(user.id);
  res.json(authResponse(user, refresh));
}

export async function logout(req: Request, res: Response) {
  const uid = req.authUser!.id;
  await AppDataSource.getRepository(RefreshToken).delete({ userId: uid });
  res.status(204).send();
}

export async function refresh(req: Request, res: Response) {
  const refresh_token = String(
    (req.body as Record<string, unknown>).refresh_token || ""
  );
  if (!refresh_token) throw E.validation();
  const row = await AppDataSource.getRepository(RefreshToken).findOne({
    where: { token: refresh_token },
    relations: ["user"],
  });
  if (!row || row.expiresAt < new Date()) throw E.unauthorized();
  res.json(authResponse(row.user, refresh_token));
}

export async function requestReset(req: Request, res: Response) {
  const email = String(
    (req.body as Record<string, unknown>).email || ""
  )
    .trim()
    .toLowerCase();
  if (!email) throw E.validation();
  const user = await AppDataSource.getRepository(User).findOne({
    where: { email },
  });
  if (user) {
    const repo = AppDataSource.getRepository(PasswordResetToken);
    await repo.delete({ userId: user.id });
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_HOURS);
    await repo.save(repo.create({ userId: user.id, token, expiresAt }));
    console.log("[password reset token]", email, token);
  }
  res.json({ ok: true });
}

export async function resetPassword(req: Request, res: Response) {
  const body = req.body as Record<string, unknown>;
  const reset_token = String(body.reset_token || "");
  const new_password = String(body.new_password || "");
  if (!reset_token || !new_password) throw E.validation();
  if (new_password.length < 6) throw E.validation();
  const repo = AppDataSource.getRepository(PasswordResetToken);
  const row = await repo.findOne({
    where: { token: reset_token },
    relations: ["user"],
  });
  if (!row || row.expiresAt < new Date()) throw E.unauthorized();
  row.user.passwordHash = await bcrypt.hash(new_password, 10);
  await AppDataSource.getRepository(User).save(row.user);
  await repo.delete({ id: row.id });
  await AppDataSource.getRepository(RefreshToken).delete({
    userId: row.user.id,
  });
  res.json({ ok: true });
}

export async function profile(req: Request, res: Response) {
  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: req.authUser!.id },
  });
  if (!user) throw E.unauthorized();
  res.json(userPublic(user));
}
