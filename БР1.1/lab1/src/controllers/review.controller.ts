import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const reviewService = new ReviewService();

export class ReviewController {
  static async getAllReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;
      const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const filters = {
        restaurantId,
        userId,
        minRating,
        maxRating,
      };
      const pagination = { page, limit };

      const reviews = await reviewService.getAllReviews(filters, pagination);
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  }

  static async getReviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid review ID', 400);
      }
      const review = await reviewService.getReviewById(id);
      res.status(200).json(review);
    } catch (error) {
      next(error);
    }
  }

  static async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const {
        restaurantId,
        bookingId,
        rating,
        comment,
      } = req.body;

      if (!restaurantId || typeof restaurantId !== 'number') {
        throw new AppError('MISSING_FIELDS', 'Restaurant ID is required', 400);
      }
      if (!bookingId || typeof bookingId !== 'number') {
        throw new AppError('MISSING_FIELDS', 'Booking ID is required', 400);
      }
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new AppError('MISSING_FIELDS', 'Rating must be between 1 and 5', 400);
      }

      const review = await reviewService.createReview({
        restaurantId,
        userId: req.user.userId,
        bookingId,
        rating,
        comment,
      });
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  static async updateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid review ID', 400);
      }
      const { rating, comment } = req.body;

      const review = await reviewService.updateReview(id, req.user.userId, { rating, comment });
      res.status(200).json(review);
    } catch (error) {
      next(error);
    }
  }

  static async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid review ID', 400);
      }

      // Admin can delete any review, user can delete only their own
      const userId = req.user.role === 'admin' ? undefined : req.user.userId;
      await reviewService.deleteReview(id, userId || req.user.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}