import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { userProfileView } from '../views';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { user, tokens } = await authService.register(req.body);
    res.status(201).json({ ...tokens, user: userProfileView(user, await userService.counters(user.id)) });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { user, tokens } = await authService.login(req.body);
    res.status(200).json({ ...tokens, user: userProfileView(user, await userService.counters(user.id)) });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    res.status(200).json(await authService.refresh(req.body.refreshToken));
  },
};
