import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const userService = new UserService();

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, full_name, phone } = req.body;

      // Validate required fields
      if (!email || !password || !full_name) {
        throw new AppError('MISSING_FIELDS', 'Email, password, and full_name are required', 400);
      }

      const result = await userService.register(email, password, full_name, phone);

      res.status(201).json({
        ...result.user,
        access_token: result.tokens.access_token,
        refresh_token: result.tokens.refresh_token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('MISSING_FIELDS', 'Email and password are required', 400);
      }

      const result = await userService.login(email, password);

      res.status(200).json({
        access_token: result.tokens.access_token,
        refresh_token: result.tokens.refresh_token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new AppError('MISSING_TOKEN', 'Refresh token is required', 400);
      }

      const tokens = await userService.refreshTokens(refresh_token);

      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const user = await userService.getProfile(req.user.userId);

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const { full_name, phone, password } = req.body;

      const user = await userService.updateProfile(req.user.userId, {
        fullName: full_name,
        phone,
        password,
      });

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
