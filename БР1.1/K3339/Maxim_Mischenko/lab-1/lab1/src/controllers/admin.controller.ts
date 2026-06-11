import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';
import { RestaurantService } from '../services/restaurant.service';
import { BookingService } from '../services/booking.service';
import { ReviewService } from '../services/review.service';
import { UserRole } from '../entities/User.entity';
import { RestaurantStatus } from '../entities/Restaurant.entity';
import { BookingStatus } from '../entities/Booking.entity';

const userService = new UserService();
const restaurantService = new RestaurantService();
const bookingService = new BookingService();
const reviewService = new ReviewService();

export class AdminController {
  static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('FORBIDDEN', 'Admin access required', 403);
      }

      const users = await userService.getAllUsers({});
      const restaurants = await restaurantService.getAllRestaurants({}, { page: 1, limit: 1000 });
      const bookings = await bookingService.getAllBookings({}, { page: 1, limit: 1000 });
      const reviews = await reviewService.getAllReviews({}, { page: 1, limit: 1000 });

      const activeRestaurants = restaurants.items.filter(r => r.restaurant_status === RestaurantStatus.OPEN);
      const pendingBookings = bookings.items.filter(b => b.status === BookingStatus.PENDING);
      const recentReviews = reviews.items.slice(0, 10);

      res.status(200).json({
        stats: {
          total_users: users.length,
          total_restaurants: restaurants.total,
          active_restaurants: activeRestaurants.length,
          total_bookings: bookings.total,
          pending_bookings: pendingBookings.length,
          total_reviews: reviews.total,
        },
        recent_reviews: recentReviews,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('FORBIDDEN', 'Admin access required', 403);
      }
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        throw new AppError('INVALID_ID', 'Invalid user ID', 400);
      }
      const { role } = req.body;
      if (!role || !Object.values(UserRole).includes(role)) {
        throw new AppError('INVALID_ROLE', 'Invalid user role', 400);
      }

      const user = await userService.updateUserRole(userId, role, req.user.userId);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async toggleRestaurantStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('FORBIDDEN', 'Admin access required', 403);
      }
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        throw new AppError('INVALID_ID', 'Invalid restaurant ID', 400);
      }
      const { restaurant_status } = req.body;
      if (!restaurant_status || !Object.values(RestaurantStatus).includes(restaurant_status)) {
        throw new AppError('INVALID_STATUS', 'Invalid restaurant status', 400);
      }

      const restaurant = await restaurantService.updateRestaurant(restaurantId, { restaurant_status });
      res.status(200).json(restaurant);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        throw new AppError('FORBIDDEN', 'Admin access required', 403);
      }
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        throw new AppError('INVALID_ID', 'Invalid user ID', 400);
      }

      await userService.deleteUser(userId, req.user.userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}