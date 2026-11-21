import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { badRequest, conflict, unauthorized } from "../utils/errors";
import { toUser } from "../utils/mappers";
import { config } from "../config";

const users = () => AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  const { email, password, name, phone, role } = req.body ?? {};
  if (!email || !password || !name || !role) throw badRequest("email, password, name, role обязательны");
  if (password.length < 8) throw badRequest("Пароль должен быть не короче 8 символов");
  if (role !== "tenant" && role !== "landlord") throw badRequest("role должен быть tenant или landlord");

  const exists = await users().findOne({ where: { email } });
  if (exists) throw conflict("Пользователь с таким email уже существует", "email_taken");

  const user = users().create({
    email,
    name,
    phone,
    role,
    passwordHash: await hashPassword(password),
  });
  await users().save(user);

  const token = signToken({ sub: String(user.id), role: user.role });
  res.status(201).json({
    access_token: token,
    token_type: "Bearer",
    expires_in: config.jwt.expiresIn,
    user: toUser(user),
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw badRequest("email и password обязательны");
  const user = await users().findOne({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized("Неверный email или пароль");
  }
  const token = signToken({ sub: String(user.id), role: user.role });
  res.json({
    access_token: token,
    token_type: "Bearer",
    expires_in: config.jwt.expiresIn,
    user: toUser(user),
  });
};
