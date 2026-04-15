import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { RestaurantStatus, OperationalStatus } from '../entities/Restaurant.entity';

const restaurantService = new RestaurantService();

export class RestaurantController {
  static async getAllRestaurants(req: Request, res: Response, next: NextFunction) {
    try {
      const cuisineId = req.query.cuisineId ? parseInt(req.query.cuisineId as string) : undefined;
      const city = req.query.city as string | undefined;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const status = req.query.status as RestaurantStatus | undefined;
      const operationalStatus = req.query.operationalStatus as OperationalStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const filters = {
        cuisineId,
        city,
        minPrice,
        maxPrice,
        status,
        operationalStatus,
      };
      const pagination = { page, limit };

      const restaurants = await restaurantService.getAllRestaurants(filters, pagination);
      res.status(200).json(restaurants);
    } catch (error) {
      next(error);
    }
  }

  static async getRestaurantById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid restaurant ID', 400);
      }
      const restaurant = await restaurantService.getRestaurantById(id);
      res.status(200).json(restaurant);
    } catch (error) {
      next(error);
    }
  }

  static async createRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const {
        name,
        description,
        cuisineId,
        city,
        address,
        avgPricePerPerson,
        latitude,
        longitude,
        workingHours,
      } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new AppError('MISSING_FIELDS', 'Restaurant name is required', 400);
      }
      if (!cuisineId || typeof cuisineId !== 'number') {
        throw new AppError('MISSING_FIELDS', 'Cuisine ID is required', 400);
      }
      if (!city || typeof city !== 'string' || city.trim() === '') {
        throw new AppError('MISSING_FIELDS', 'City is required', 400);
      }
      if (!address || typeof address !== 'string' || address.trim() === '') {
        throw new AppError('MISSING_FIELDS', 'Address is required', 400);
      }

      const restaurant = await restaurantService.createRestaurant({
        name: name.trim(),
        description: description?.trim(),
        cuisineId,
        city: city.trim(),
        address: address.trim(),
        avgPricePerPerson,
        latitude,
        longitude,
        workingHours,
      });
      res.status(201).json(restaurant);
    } catch (error) {
      next(error);
    }
  }

  static async updateRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid restaurant ID', 400);
      }
      const data = req.body;
      const restaurant = await restaurantService.updateRestaurant(id, data);
      res.status(200).json(restaurant);
    } catch (error) {
      next(error);
    }
  }

  static async deleteRestaurant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid restaurant ID', 400);
      }
      await restaurantService.deleteRestaurant(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}