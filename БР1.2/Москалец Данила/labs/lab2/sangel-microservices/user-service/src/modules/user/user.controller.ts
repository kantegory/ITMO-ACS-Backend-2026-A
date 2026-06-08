import { Response } from 'express';
import { UserService } from './user.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json(errorResponse(401, 'Unauthorized'));
      }

      const user = await this.userService.getUserById(userId);
      
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(successResponse(userWithoutPassword));
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json(errorResponse(401, 'Unauthorized'));
      }

      const user = await this.userService.updateProfile(userId, req.body);
      
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(successResponse(userWithoutPassword));
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  changePassword = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json(errorResponse(401, 'Unauthorized'));
      }

      await this.userService.changePassword(userId, req.body);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Current password is incorrect') {
        res.status(400).json(errorResponse(400, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };
}