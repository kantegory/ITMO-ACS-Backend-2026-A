import { Repository, FindOptionsWhere } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { AppDataSource } from '../../config/database';
import { CreateReviewDto, ReviewListQuery } from './review.dto';
import axios from 'axios';
import { settings } from '../../config/settings';
import { publishReviewCreated } from '../../events/order.publisher';

export class ReviewService {
  private reviewRepository: Repository<Review>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
  }

  private async hasAcceptedRequest(userId: number, serviceId: number): Promise<boolean> {
    try {
      const response = await axios.get(`${settings.companyServiceUrl}/api/v1/services/${serviceId}`);
      const service = response.data.data;
      
      // Здесь нужно проверить, есть ли у пользователя принятая заявка на эту услугу
      // В реальном приложении нужно сделать запрос к Request Service
      // Для упрощения пока возвращаем true
      return true;
    } catch (error) {
      return false;
    }
  }

  async findById(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });
    if (!review) {
      throw new Error('Review not found');
    }
    return review;
  }

  async findServiceReviews(
    serviceId: number,
    query: ReviewListQuery
  ): Promise<[Review[], number, { avg_rating: number | null; total_reviews: number }]> {
    const { page, page_size, sort_by, sort_order } = query;
    
    const where: FindOptionsWhere<Review> = { service_id: serviceId };
    
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where,
      skip: (page - 1) * page_size,
      take: page_size,
      order: { [sort_by]: sort_order },
    });

    const avgResult = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.service_id = :serviceId', { serviceId })
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .getRawOne();

    return [
      reviews,
      total,
      {
        avg_rating: avgResult.avg_rating ? parseFloat(avgResult.avg_rating) : null,
        total_reviews: parseInt(avgResult.total_reviews) || 0,
      },
    ];
  }

  async findUserReviews(
    userId: number,
    query: ReviewListQuery
  ): Promise<[Review[], number]> {
    const { page, page_size, sort_by, sort_order } = query;
    
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { user_id: userId },
      skip: (page - 1) * page_size,
      take: page_size,
      order: { [sort_by]: sort_order },
    });

    return [reviews, total];
  }

  async create(userId: number, serviceId: number, dto: CreateReviewDto): Promise<Review> {
    const hasAccepted = await this.hasAcceptedRequest(userId, serviceId);
    if (!hasAccepted) {
      throw new Error('You can only review services you have an accepted request for');
    }

    const existing = await this.reviewRepository.findOne({
      where: { service_id: serviceId, user_id: userId },
    });
    if (existing) {
      throw new Error('You have already reviewed this service');
    }

    const review = this.reviewRepository.create({
      user_id: userId,
      service_id: serviceId,
      rating: dto.rating,
      comment: dto.comment || null,
    });

    const saved = await this.reviewRepository.save(review);
    await publishReviewCreated(saved);
    return this.findById(saved.id);
  }

  async delete(id: number, userId: number, isAdmin: boolean): Promise<void> {
    const review = await this.findById(id);
    
    if (review.user_id !== userId && !isAdmin) {
      throw new Error('Forbidden');
    }
    
    await this.reviewRepository.remove(review);
  }

  async getServiceRating(serviceId: number): Promise<{ avg_rating: number | null; total_reviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.service_id = :serviceId', { serviceId })
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .getRawOne();

    return {
      avg_rating: result.avg_rating ? parseFloat(result.avg_rating) : null,
      total_reviews: parseInt(result.total_reviews) || 0,
    };
  }

  async getCompanyRating(companyId: number): Promise<{ avg_rating: number | null; total_reviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.company_id = :companyId', { companyId })
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .getRawOne();

    return {
      avg_rating: result.avg_rating ? parseFloat(result.avg_rating) : null,
      total_reviews: parseInt(result.total_reviews) || 0,
    };
  }
}