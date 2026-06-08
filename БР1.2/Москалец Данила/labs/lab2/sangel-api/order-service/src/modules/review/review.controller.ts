import { Request, Response } from 'express';
import { ReviewService } from './review.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { ReviewListQuerySchema } from './review.dto';
import { parseIdParam } from '../../utils/parse-id-param';
import axios from 'axios';
import { settings } from '../../config/settings';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

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

  getServiceReviews = async (req: Request, res: Response) => {
    try {
      const serviceId = parseIdParam(req.params.service_id, 'service_id');
      const validated = ReviewListQuerySchema.parse({ query: req.query });
      
      const [reviews, total, rating] = await this.reviewService.findServiceReviews(
        serviceId,
        validated.query
      );
      
      const enriched = await this.enrichReviews(reviews);
      
      // Получаем информацию об услуге
      let serviceInfo = null;
      try {
        const serviceResponse = await axios.get(`${settings.companyServiceUrl}/api/v1/services/${serviceId}`);
        serviceInfo = serviceResponse.data.data;
      } catch (error) {
        // Если сервис не найден, продолжаем без информации
      }
      
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

  getCompanyReviews = async (req: Request, res: Response) => {
    try {
      const companyId = parseIdParam(req.params.company_id, 'company_id');
      const validated = ReviewListQuerySchema.parse({ query: req.query });
      const { page, page_size } = validated.query;
      
      const rating = await this.reviewService.getCompanyRating(companyId);
      
      res.status(200).json(successResponse({
        avg_rating: rating.avg_rating,
        total_reviews: rating.total_reviews,
        data: [],
        pagination: {
          total: 0,
          page,
          page_size,
          total_pages: 0,
        },
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  createReview = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const serviceId = parseIdParam(req.params.service_id, 'service_id');
      
      const review = await this.reviewService.create(userId, serviceId, req.body);
      const enriched = (await this.enrichReviews([review]))[0];
      res.status(201).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'You can only review services you have an accepted request for') {
        res.status(403).json(errorResponse(403, error.message));
      } else if (error.message === 'You have already reviewed this service') {
        res.status(409).json(errorResponse(409, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  deleteReview = async (req: AuthRequest, res: Response) => {
    try {
      const reviewId = parseIdParam(req.params.review_id, 'review_id');
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

  private async getServiceInfo(serviceId: number): Promise<any> {
    try {
      const response = await axios.get(`${settings.companyServiceUrl}/api/v1/services/${serviceId}`);
      return response.data.data;
    } catch (error) {
      return null;
    }
  }

  private async getUserInfo(userId: number): Promise<any> {
    try {
      const response = await axios.get(`${settings.userServiceUrl}/internal/users/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  private async enrichReviews(reviews: any[]): Promise<any[]> {
    const enriched = [];
    for (const review of reviews) {
      const service = await this.getServiceInfo(review.service_id);
      const user = await this.getUserInfo(review.user_id);
      
      enriched.push({
        id: review.id,
        service_id: review.service_id,
        service_name: service?.name || '',
        company_id: service?.company_id || 0,
        company_title: service?.company_title || '',
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
        } : { id: review.user_id, first_name: '', last_name: '' },
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
      });
    }
    return enriched;
  }
}