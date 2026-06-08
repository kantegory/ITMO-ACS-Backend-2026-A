import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json(successResponse(user));
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        res.status(409).json(errorResponse(409, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json(successResponse(result));
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json(errorResponse(401, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      const tokens = await this.authService.refreshToken(refresh_token);
      res.status(200).json(successResponse(tokens));
    } catch (error: any) {
      res.status(401).json(errorResponse(401, error.message));
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      await this.authService.logout(refresh_token);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  getMe = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json(errorResponse(401, 'Unauthorized'));
      }
      const user = await this.authService.getCurrentUser(userId);
      res.status(200).json(successResponse(user));
    } catch (error: any) {
      res.status(404).json(errorResponse(404, error.message));
    }
  };
}