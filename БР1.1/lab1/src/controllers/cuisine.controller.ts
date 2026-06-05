import { Request, Response, NextFunction } from 'express';
import { CuisineService } from '../services/cuisine.service';
import { AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const cuisineService = new CuisineService();

export class CuisineController {
  static async getAllCuisines(req: Request, res: Response, next: NextFunction) {
    try {
      const cuisines = await cuisineService.getAllCuisines();
      res.status(200).json(cuisines);
    } catch (error) {
      next(error);
    }
  }

  static async getCuisineById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid cuisine ID', 400);
      }
      const cuisine = await cuisineService.getCuisineById(id);
      res.status(200).json(cuisine.toResponse());
    } catch (error) {
      next(error);
    }
  }

  static async createCuisine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('MISSING_FIELDS', 'Cuisine name is required', 400);
      }
      const cuisine = await cuisineService.createCuisine(name.trim());
      res.status(201).json(cuisine);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCuisine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid cuisine ID', 400);
      }
      await cuisineService.deleteCuisine(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
