import { AppDataSource } from '../config/data-source';
import { Booking, BookingStatus } from '../entities/Booking.entity';
import { Restaurant } from '../entities/Restaurant.entity';
import { Table } from '../entities/Table.entity';
import { User } from '../entities/User.entity';
import { AppError } from '../middleware/error-handler';

export class BookingService {
  private bookingRepository = AppDataSource.getRepository(Booking);
  private restaurantRepository = AppDataSource.getRepository(Restaurant);
  private tableRepository = AppDataSource.getRepository(Table);
  private userRepository = AppDataSource.getRepository(User);

  async getAllBookings(
    filters?: {
      userId?: number;
      restaurantId?: number;
      status?: BookingStatus;
      fromDate?: string;
      toDate?: string;
    },
    pagination?: { page: number; limit: number }
  ): Promise<any[]> {
    const query = this.bookingRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.restaurant', 'restaurant')
      .leftJoinAndSelect('booking.table', 'table')
      .leftJoinAndSelect('booking.user', 'user');

    if (filters?.userId) {
      query.andWhere('booking.user_id = :userId', { userId: filters.userId });
    }
    if (filters?.restaurantId) {
      query.andWhere('booking.restaurant_id = :restaurantId', { restaurantId: filters.restaurantId });
    }
    if (filters?.status) {
      query.andWhere('booking.status = :status', { status: filters.status });
    }
    if (filters?.fromDate) {
      query.andWhere('booking.booking_date >= :fromDate', { fromDate: filters.fromDate });
    }
    if (filters?.toDate) {
      query.andWhere('booking.booking_date <= :toDate', { toDate: filters.toDate });
    }

    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      query.skip(skip).take(pagination.limit);
    }

    query.orderBy('booking.bookingDate', 'DESC').addOrderBy('booking.startTime', 'ASC');

    const bookings = await query.getMany();
    return bookings.map(booking => booking.toResponse());
  }

  async getBookingById(id: number): Promise<any> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['restaurant', 'table', 'user'],
    });

    if (!booking) {
      throw new AppError('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    return booking.toResponse();
  }

  async createBooking(data: {
    restaurantId: number;
    tableId: number;
    userId: number;
    bookingDate: string;
    startTime: string;
    endTime: string;
    guestsCount: number;
    comment?: string;
  }): Promise<any> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({ where: { id: data.restaurantId } });
    if (!restaurant) {
      throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404);
    }

    // Validate table exists and belongs to the restaurant
    const table = await this.tableRepository.findOne({
      where: { id: data.tableId, restaurant: { id: data.restaurantId } },
      relations: ['restaurant'],
    });
    if (!table) {
      throw new AppError('TABLE_NOT_FOUND', 'Table not found or does not belong to the restaurant', 404);
    }

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: data.userId } });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Check for overlapping bookings for the same table and time
    const overlappingBooking = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.table_id = :tableId', { tableId: data.tableId })
      .andWhere('booking.booking_date = :bookingDate', { bookingDate: data.bookingDate })
      .andWhere('booking.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [BookingStatus.CANCELLED],
      })
      .andWhere(
        '(booking.start_time < :endTime AND booking.end_time > :startTime)',
        { startTime: data.startTime, endTime: data.endTime }
      )
      .getOne();

    if (overlappingBooking) {
      throw new AppError('TABLE_UNAVAILABLE', 'Table is already booked for the selected time slot', 409);
    }

    const booking = this.bookingRepository.create({
      restaurant,
      table,
      user,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      guestsCount: data.guestsCount,
      comment: data.comment,
      status: BookingStatus.PENDING,
    });

    await this.bookingRepository.save(booking);
    return booking.toResponse();
  }

  async updateBookingStatus(id: number, status: BookingStatus, userId?: number): Promise<any> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!booking) {
      throw new AppError('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // If userId provided, ensure the booking belongs to the user (for user cancellations)
    if (userId && booking.user.id !== userId) {
      throw new AppError('FORBIDDEN', 'You are not allowed to modify this booking', 403);
    }

    booking.status = status;
    await this.bookingRepository.save(booking);
    return booking.toResponse();
  }

  async deleteBooking(id: number, userId?: number): Promise<void> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!booking) {
      throw new AppError('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    // If userId provided, ensure the booking belongs to the user
    if (userId && booking.user.id !== userId) {
      throw new AppError('FORBIDDEN', 'You are not allowed to delete this booking', 403);
    }

    // Soft delete: set status to cancelled
    booking.status = BookingStatus.CANCELLED;
    await this.bookingRepository.save(booking);
  }
}