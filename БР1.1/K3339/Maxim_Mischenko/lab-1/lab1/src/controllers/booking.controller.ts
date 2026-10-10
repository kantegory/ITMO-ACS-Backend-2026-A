import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { BookingStatus } from '../entities/Booking.entity';

const bookingService = new BookingService();

export class BookingController {
  static async getAllBookings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }

      const userId = req.user.role === 'admin' ? undefined : req.user.userId;
      const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
      const status = req.query.status as BookingStatus | undefined;
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const filters = {
        userId,
        restaurantId,
        status,
        fromDate,
        toDate,
      };
      const pagination = { page, limit };

      const bookings = await bookingService.getAllBookings(filters, pagination);
      res.status(200).json(bookings);
    } catch (error) {
      next(error);
    }
  }

  static async getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid booking ID', 400);
      }
      const booking = await bookingService.getBookingById(id);
      // Ensure user owns the booking or is admin
      if (req.user.role !== 'admin' && booking.user.id !== req.user.userId) {
        throw new AppError('FORBIDDEN', 'You are not allowed to view this booking', 403);
      }
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const {
        restaurantId,
        restaurant_id,
        tableId,
        table_id,
        bookingDate,
        booking_date,
        startTime,
        start_time,
        endTime,
        end_time,
        guestsCount,
        guests_count,
        comment,
      } = req.body;

      // Support both camelCase and snake_case
      const restaurantIdFinal = restaurantId ?? restaurant_id;
      const tableIdFinal = tableId ?? table_id;
      const bookingDateFinal = bookingDate ?? booking_date;
      const startTimeFinal = startTime ?? start_time;
      const endTimeFinal = endTime ?? end_time;
      const guestsCountFinal = guestsCount ?? guests_count;

      if (!restaurantIdFinal || typeof restaurantIdFinal !== 'number') {
        throw new AppError('MISSING_FIELDS', 'Restaurant ID is required', 400);
      }
      if (!tableIdFinal || typeof tableIdFinal !== 'number') {
        throw new AppError('MISSING_FIELDS', 'Table ID is required', 400);
      }
      if (!bookingDateFinal || typeof bookingDateFinal !== 'string') {
        throw new AppError('MISSING_FIELDS', 'Booking date is required', 400);
      }
      if (!startTimeFinal || typeof startTimeFinal !== 'string') {
        throw new AppError('MISSING_FIELDS', 'Start time is required', 400);
      }
      if (!endTimeFinal || typeof endTimeFinal !== 'string') {
        throw new AppError('MISSING_FIELDS', 'End time is required', 400);
      }
      if (!guestsCountFinal || typeof guestsCountFinal !== 'number' || guestsCountFinal < 1) {
        throw new AppError('MISSING_FIELDS', 'Valid guests count is required', 400);
      }

      const booking = await bookingService.createBooking({
        restaurantId: restaurantIdFinal,
        tableId: tableIdFinal,
        userId: req.user.userId,
        bookingDate: bookingDateFinal,
        startTime: startTimeFinal,
        endTime: endTimeFinal,
        guestsCount: guestsCountFinal,
        comment,
      });
      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async updateBookingStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid booking ID', 400);
      }
      const { status } = req.body;
      if (!status || !Object.values(BookingStatus).includes(status)) {
        throw new AppError('INVALID_STATUS', 'Invalid booking status', 400);
      }

      const userId = req.user.role === 'admin' ? undefined : req.user.userId;
      const booking = await bookingService.updateBookingStatus(id, status, userId);
      res.status(200).json(booking);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('INVALID_ID', 'Invalid booking ID', 400);
      }

      const userId = req.user.role === 'admin' ? undefined : req.user.userId;
      await bookingService.deleteBooking(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}