import { Response } from "express";
import * as bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/authMiddleware";

export class UserController {
  static async getMe(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: req.user!.id });

      if (!user) {
        return res.status(404).json({ error: { code: "not_found", message: "пользователь не найден" } });
      }

      const { password: _pw, ...userOut } = user;
      return res.status(200).json(userOut);
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async updateMe(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { first_name, last_name, phone } = req.body;

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: req.user!.id });

      if (!user) {
        return res.status(404).json({ error: { code: "not_found", message: "пользователь не найден" } });
      }

      if (first_name) user.first_name = first_name;
      if (last_name) user.last_name = last_name;
      if (phone) user.phone = phone;

      await userRepo.save(user);

      const { password: _pw, ...userOut } = user;
      return res.status(200).json(userOut);
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          error: { code: "bad_request", message: "текущий и новый пароль обязательны" },
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOneBy({ id: req.user!.id });

      if (!user || !(await bcrypt.compare(current_password, user.password))) {
        return res.status(401).json({
          error: { code: "invalid_current_password", message: "неверный текущий пароль" },
        });
      }

      if (new_password.length < 8) {
        return res.status(422).json({
          error: {
            code: "validation_error",
            message: "ошибка валидации входных данных",
            details: { new_password: ["пароль должен содержать минимум 8 символов"] },
          },
        });
      }

      user.password = await bcrypt.hash(new_password, 10);
      await userRepo.save(user);

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }
}
