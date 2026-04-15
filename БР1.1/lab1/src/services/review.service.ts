import { AppDataSource } from '../config/data-source';
import { Review } from '../entities/Review.entity';
import { Restaurant } from '../entities/Restaurant.entity';
import { User } from '../entities/User.entity';
import { Booking } from '../entities/Booking.entity';
import { AppError } from '../middleware/error-handler';

export class ReviewService {
  private reviewRepository = AppDataSource.getRepository(Review);
  private restaurantRepository = AppDataSource.getRepository(Restaurant);
  private userRepository = AppDataSource.getRepository(User);
  private bookingRepository = AppDataSource.getRepository(Booking);

  async getAllReviews(
    filters?: {
      restaurantId?: number;
      userId?: number;
      minRating?: number;
      maxRating?: number;
    },
    pagination?: { page: number; limit: number }
  ): Promise<any[]> {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.restaurant', 'restaurant')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.booking', 'booking');

    if (filters?.restaurantId) {
      query.andWhere('review.restaurant_id = :restaurantId', { restaurantId: filters.restaurantId });
    }
    if (filters?.userId) {
      query.andWhere('review.user_id = :userId', { userId: filters.userId });
    }
    if (filters?.minRating !== undefined) {
      query.andWhere('review.rating >= :minRating', { minRating: filters.minRating });
    }
    if (filters?.maxRating !== undefined) {
      query.andWhere('review.rating <= :maxRating', { maxRating: filters.maxRating });
    }

    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      query.skip(skip).take(pagination.limit);
    }

    query.orderBy('review.createdAt', 'DESC');

    const reviews = await query.getMany();
    return reviews.map(review => review.toResponse());
  }

  async getReviewById(id: number): Promise<any> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['restaurant', 'user', 'booking'],
    });

    if (!review) {
      throw new AppError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    return review.toResponse();
  }

  async createReview(data: {
    restaurantId: number;
    userId: number;
    bookingId: number;
    rating: number;
    comment?: string;
  }): Promise<any> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({ where: { id: data.restaurantId } });
    if (!restaurant) {
      throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404);
    }

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: data.userId } });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    // Validate booking exists and belongs to the user and restaurant
    const booking = await this.bookingRepository.findOne({
      where: { id: data.bookingId, user: { id: data.userId }, restaurant: { id: data.restaurantId } },
      relations: ['user', 'restaurant'],
    });
    if (!booking) {
      throw new AppError('BOOKING_NOT_FOUND', 'Booking not found or does not belong to the user/restaurant', 404);
    }

    // Check if user already reviewed this booking
    const existingReview = await this.reviewRepository.findOne({
      where: { booking: { id: data.bookingId } },
    });
    if (existingReview) {
      throw new AppError('DUPLICATE_REVIEW', 'You have already reviewed this booking', 409);
    }

    const review = this.reviewRepository.create({
      restaurant,
      user,
      booking,
      rating: data.rating,
      comment: data.comment,
    });

    await this.reviewRepository.save(review);
    return review.toResponse();
  }

  async updateReview(id: number, userId: number, data: { rating?: number; comment?: string }): Promise<any> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) {
      throw new AppError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    // Ensure the review belongs to the user
    if (review.user.id !== userId) {
      throw new AppError('FORBIDDEN', 'You are not allowed to modify this review', 403);
    }

    if (data.rating !== undefined) {
      review.rating = data.rating;
    }
    if (data.comment !== undefined) {
      review.comment = data.comment;
    }

    await this.reviewRepository.save(review);
    return review.toResponse();
  }

  async deleteReview(id: number, userId: number): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) {
      throw new AppError('REVIEW_NOT_FOUND', 'Review not found', 404);
    }

    // Ensure the review belongs to the user (or admin - but admin check is done in controller)
    if (review.user.id !== userId) {
      throw new AppError('FORBIDDEN', 'You are not allowed to delete this review', 403);
    }

    await this.reviewRepository.remove(review);
  }
}