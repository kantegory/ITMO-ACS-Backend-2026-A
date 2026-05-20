import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { env } from "../config/env";
import { toUser } from "../utils/mappers";
import { UserRole } from "../entities/User";
import { unauthorized } from "../utils/errors";

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, full_name, role } = req.body;
      const { user, tokens } = await AuthService.register({
        email,
        password,
        fullName: full_name,
        role: role as UserRole,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });
      setRefreshCookie(res, tokens.refreshToken);
      res.status(201).json({
        access_token: tokens.accessToken,
        user: toUser(user),
      });
    } catch (e) {
      next(e);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await AuthService.login({
        email,
        password,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });
      setRefreshCookie(res, tokens.refreshToken);
      res.json({ access_token: tokens.accessToken, user: toUser(user) });
    } catch (e) {
      next(e);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rt = req.cookies?.refresh_token;
      if (!rt) throw unauthorized();
      const tokens = await AuthService.refresh(
        rt,
        req.headers["user-agent"],
        req.ip,
      );
      setRefreshCookie(res, tokens.refreshToken);
      res.json({ access_token: tokens.accessToken });
    } catch (e) {
      next(e);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rt = req.cookies?.refresh_token;
      if (rt) await AuthService.logout(rt);
      res.clearCookie("refresh_token", { path: "/api/v1/auth" });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
}
