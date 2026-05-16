import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRole } from '../entities/User.entity';

const userService = new UserService();

export class UserController {
  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!role || !Object.values(UserRole).includes(role)) {
        throw new AppError('INVALID_ROLE', 'Invalid role value', 400);
      }

      const user = await userService.updateUserRole(userId, role, req.user.userId);

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
