import type { Model } from 'sequelize';

declare global {
  namespace Express {
    interface Request {
      user?: Model & { id: number; name: string; email: string; role: string };
    }
  }
}

export {};
