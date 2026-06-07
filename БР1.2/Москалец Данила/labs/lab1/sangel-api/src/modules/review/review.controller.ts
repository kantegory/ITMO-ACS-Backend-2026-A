// src/modules/review/review.controller.ts
import { Request, Response } from 'express';
import { ReviewService } from './review.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { ReviewListQuerySchema } from './review.dto';
import { AppDataSource } from '../../config/database';
import { Review } from './review.entity';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  // Мои отзывы
  getMyReviews = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const validated = ReviewListQuerySchema.parse({ query: req.query });
      
      const [reviews, total] = await this.reviewService.findUserReviews(
        userId,
        validated.query
      );
      
      const enriched = await this.enrichReviews(reviews);
      res.status(200).json(successResponse(
        buildPaginatedResponse(enriched, total, {
          page: validated.query.page,
          page_size: validated.query.page_size,
        })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Отзывы об услуге (публичный)
  getServiceReviews = async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const validated = ReviewListQuerySchema.parse({ query: req.query });
      
      const [reviews, total, rating] = await this.reviewService.findServiceReviews(
        serviceId,
        validated.query
      );
      
      const enriched = await this.enrichReviews(reviews);
      res.status(200).json(successResponse({
        avg_rating: rating.avg_rating,
        total_reviews: rating.total_reviews,
        data: buildPaginatedResponse(enriched, total, {
          page: validated.query.page,
          page_size: validated.query.page_size,
        }).data,
        pagination: buildPaginatedResponse(enriched, total, {
          page: validated.query.page,
          page_size: validated.query.page_size,
        }).pagination,
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Отзывы о компании (публичный)
  getCompanyReviews = async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.company_id);
      const validated = ReviewListQuerySchema.parse({ query: req.query });
      const { page, page_size } = validated.query;
      
      // Получаем рейтинг компании
      const rating = await this.reviewService.getCompanyRating(companyId);
      
      // Получаем список отзывов о компании (агрегация по всем услугам)
      const reviewRepository = AppDataSource.getRepository(Review);
      
      const [reviews, total] = await reviewRepository
        .createQueryBuilder('review')
        .leftJoinAndSelect('review.user', 'user')
        .leftJoinAndSelect('review.service', 'service')
        .leftJoinAndSelect('service.company', 'company')
        .where('company.id = :companyId', { companyId })
        .skip((page - 1) * page_size)
        .take(page_size)
        .orderBy(`review.${validated.query.sort_by}`, validated.query.sort_order.toUpperCase() as 'ASC' | 'DESC')
        .getManyAndCount();
      
      // Обогащаем отзывы
      const enriched = reviews.map(review => ({
        id: review.id,
        service_id: review.service.id,
        service_name: review.service.name,
        company_id: companyId,
        company_title: review.service.company.title,
        user: {
          id: review.user.id,
          first_name: review.user.first_name,
          last_name: review.user.last_name,
        },
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
      }));
      
      res.status(200).json(successResponse({
        avg_rating: rating.avg_rating,
        total_reviews: rating.total_reviews,
        data: buildPaginatedResponse(enriched, total, {
          page,
          page_size,
        }).data,
        pagination: buildPaginatedResponse(enriched, total, {
          page,
          page_size,
        }).pagination,
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Создать отзыв
  createReview = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const serviceId = parseInt(req.params.service_id);
      
      const review = await this.reviewService.create(userId, serviceId, req.body);
      const enriched = (await this.enrichReviews([review]))[0];
      res.status(201).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Service not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'You can only review services you have an accepted request for') {
        res.status(403).json(errorResponse(403, error.message));
      } else if (error.message === 'You have already reviewed this service') {
        res.status(409).json(errorResponse(409, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Удалить отзыв
  deleteReview = async (req: AuthRequest, res: Response) => {
    try {
      const reviewId = parseInt(req.params.review_id);
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      await this.reviewService.delete(reviewId, userId, isAdmin);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Review not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Forbidden') {
        res.status(403).json(errorResponse(403, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  private async enrichReviews(reviews: any[]): Promise<any[]> {
    return reviews.map(review => ({
      id: review.id,
      service_id: review.service?.id || review.service_id,
      service_name: review.service?.name || '',
      company_id: review.service?.company?.id || 0,
      company_title: review.service?.company?.title || '',
      user: {
        id: review.user.id,
        first_name: review.user.first_name,
        last_name: review.user.last_name,
      },
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
    }));
  }
}