import { Request, Response } from "express";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const JWT_EXPIRES_IN = 86400; // 24 hours in seconds

export class AuthController {
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, first_name, last_name, phone } = req.body;

      if (!email || !password || !first_name || !last_name || !phone) {
        return res.status(400).json({
          error: { code: "bad_request", message: "все поля обязательны" },
        });
      }

      if (password.length < 8) {
        return res.status(422).json({
          error: {
            code: "validation_error",
            message: "ошибка валидации входных данных",
            details: { password: ["пароль должен содержать минимум 8 символов"] },
          },
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const existing = await userRepo.findOneBy({ email });

      if (existing) {
        return res.status(409).json({
          error: {
            code: "user_already_exists",
            message: `пользователь с email ${email} уже зарегистрирован`,
          },
        });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = userRepo.create({ email, password: hashed, first_name, last_name, phone });
      await userRepo.save(user);

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const { password: _pw, ...userOut } = user;

      return res.status(201).json({
        access_token: token,
        token_type: "bearer",
        expires_in: JWT_EXPIRES_IN,
        user: userOut,
      });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: { code: "bad_request", message: "email и пароль обязательны" },
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
          error: { code: "invalid_credentials", message: "неверный email или пароль" },
        });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const { password: _pw, ...userOut } = user;

      return res.status(200).json({
        access_token: token,
        token_type: "bearer",
        expires_in: JWT_EXPIRES_IN,
        user: userOut,
      });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }
}
