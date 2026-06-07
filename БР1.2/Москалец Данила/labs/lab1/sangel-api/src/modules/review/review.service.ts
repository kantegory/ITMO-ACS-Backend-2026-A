import { Repository, FindOptionsWhere } from 'typeorm';
import { Review } from './review.entity';
import { Service } from '../service/service.entity';
import { RequestService } from '../request/request.service';
import { AppDataSource } from '../../config/database';
import { CreateReviewDto, ReviewListQuery } from './review.dto';

export class ReviewService {
  private reviewRepository: Repository<Review>;
  private serviceRepository: Repository<Service>;
  private requestService: RequestService;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.serviceRepository = AppDataSource.getRepository(Service);
    this.requestService = new RequestService();
  }

  async findById(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['service', 'service.company', 'user'],
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
      relations: ['user'],
      skip: (page - 1) * page_size,
      take: page_size,
      order: { [sort_by]: sort_order },
    });

    // Подсчет средней оценки
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
      relations: ['service', 'service.company'],
      skip: (page - 1) * page_size,
      take: page_size,
      order: { [sort_by]: sort_order },
    });

    return [reviews, total];
  }

  async create(userId: number, serviceId: number, dto: CreateReviewDto): Promise<Review> {
    // Проверяем существование услуги
    const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new Error('Service not found');
    }

    // Проверяем, есть ли у пользователя принятая заявка на эту услугу
    const hasAccepted = await this.requestService.hasAcceptedRequest(userId, serviceId);
    if (!hasAccepted) {
      throw new Error('You can only review services you have an accepted request for');
    }

    // Проверяем, не оставлял ли пользователь уже отзыв
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

    return this.reviewRepository.save(review);
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
      .innerJoin('review.service', 'service')
      .where('service.company_id = :companyId', { companyId })
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .getRawOne();

    return {
      avg_rating: result.avg_rating ? parseFloat(result.avg_rating) : null,
      total_reviews: parseInt(result.total_reviews) || 0,
    };
  }
}