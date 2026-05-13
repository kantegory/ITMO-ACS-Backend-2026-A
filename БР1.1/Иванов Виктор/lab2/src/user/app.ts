import express from "express";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { UserDataSource } from "./dataSource";
import { User } from "./entity/User";
import { requireInternalToken } from "../lib/internalAuth";

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const JWT_EXPIRES_IN = 86400;

export function createUserApp() {
  const app = express();
  app.use(express.json());

  app.post("/auth/register", async (req, res) => {
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

      const userRepo = UserDataSource.getRepository(User);
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
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: { code: "bad_request", message: "email и пароль обязательны" },
        });
      }

      const userRepo = UserDataSource.getRepository(User);
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
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  app.get("/internal/users/:userId", requireInternalToken, async (req, res) => {
    try {
      const userRepo = UserDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: req.params.userId });
      if (!user) {
        return res.status(404).json({ error: { code: "not_found", message: "пользователь не найден" } });
      }
      const { password: _pw, ...userOut } = user;
      return res.status(200).json(userOut);
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  return app;
}
