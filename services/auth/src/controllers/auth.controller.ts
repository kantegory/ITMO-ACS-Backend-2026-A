import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { AuthService, UserService } from "../services/auth.service";
import { env } from "../config/env";
import { toUser, toUserInternal } from "../utils/mappers";
import { UserRole } from "../entities/User";
import { unauthorized } from "../utils/errors";
import { routeParam } from "../utils/params";

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

export class UserController {
  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(req.user!.userId);
      res.json(toUser(user));
    } catch (e) {
      next(e);
    }
  }
}

export class InternalController {
  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getById(routeParam(req.params.id));
      res.json(toUserInternal(user));
    } catch (e) {
      next(e);
    }
  }

  static async validateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const role = typeof req.query.role === "string" ? req.query.role : undefined;
      const user = await UserService.validate(routeParam(req.params.id), role);
      res.json(toUserInternal(user));
    } catch (e) {
      next(e);
    }
  }
}
