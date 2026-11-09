import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { UserProfile } from "../entity/UserProfile";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/jwt";

export class AuthController {
  static async register(req: Request, res: Response) {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      res
        .status(400)
        .json({
          error: "Bad Request",
          message: "Missing required fields",
          status_code: 400,
        });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({
          error: "Bad Request",
          message: "Password must be at least 6 characters",
          status_code: 400,
        });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);
    const existing = await userRepo.findOneBy({ email });

    if (existing) {
      res
        .status(409)
        .json({
          error: "Conflict",
          message: "Email already exists",
          status_code: 409,
        });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepo.create({ email, password_hash: hashedPassword });
    await userRepo.save(user);

    const profileRepo = AppDataSource.getRepository(UserProfile);
    const profile = profileRepo.create({ user_id: user.id, full_name });
    await profileRepo.save(profile);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ email });

    if (!user) {
      res
        .status(401)
        .json({
          error: "Unauthorized",
          message: "Invalid credentials",
          status_code: 401,
        });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res
        .status(401)
        .json({
          error: "Unauthorized",
          message: "Invalid credentials",
          status_code: 401,
        });
      return;
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  static async refresh(req: Request, res: Response) {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res
        .status(400)
        .json({
          error: "Bad Request",
          message: "Refresh token required",
          status_code: 400,
        });
      return;
    }

    const decoded = verifyToken(refresh_token);
    if (!decoded) {
      res
        .status(401)
        .json({
          error: "Unauthorized",
          message: "Invalid refresh token",
          status_code: 401,
        });
      return;
    }

    const accessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });
    res.json({ access_token: accessToken });
  }

  static async logout(req: Request, res: Response) {
    res.status(204).send();
  }
}
