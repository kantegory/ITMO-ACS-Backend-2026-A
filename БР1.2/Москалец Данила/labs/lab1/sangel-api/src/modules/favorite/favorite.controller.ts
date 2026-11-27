// src/modules/favorite/favorite.controller.ts
import { Response } from 'express';
import { FavoriteService } from './favorite.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { AppDataSource } from '../../config/database';
import { Review } from '../review/review.entity';
import { parseIdParam } from '../../utils/parse-id-param';

export class FavoriteController {
  private favoriteService: FavoriteService;

  constructor() {
    this.favoriteService = new FavoriteService();
  }

  // Мои избранные услуги
  getMyFavorites = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const { page, page_size } = getPaginationParams(
        req.query.page as any,
        req.query.page_size as any
      );
      
      const [favorites, total] = await this.favoriteService.findByUser(userId, page, page_size);
      
      // Получаем рейтинги для всех услуг
      const enriched = await Promise.all(favorites.map(async (fav) => {
        const service = fav.service;
        const discount = service.discount;
        
        // Проверка скидки
        const isDiscountActive = discount 
          ? new Date() >= discount.start_at && new Date() <= discount.end_at
          : false;
        
        // Безопасное вычисление финальной цены
        const finalPrice = isDiscountActive && discount
          ? Number(service.base_price) * (100 - discount.percentage) / 100 
          : Number(service.base_price);
        
        // Получаем рейтинг услуги
        const ratingResult = await AppDataSource.getRepository(Review)
          .createQueryBuilder('review')
          .where('review.service_id = :serviceId', { serviceId: service.id })
          .select('AVG(review.rating)', 'avg_rating')
          .addSelect('COUNT(review.id)', 'total_reviews')
          .getRawOne();
        
        const avgRating = ratingResult?.avg_rating ? parseFloat(ratingResult.avg_rating) : null;
        
        return {
          service_id: service.id,
          name: service.name,
          company: {
            id: service.company.id,
            title: service.company.title,
          },
          price: Number(service.base_price),
          final_price: finalPrice,
          avg_rating: avgRating,       
          added_at: fav.created_at,
        };
      }));
      
      res.status(200).json(successResponse(
        buildPaginatedResponse(enriched, total, { page, page_size })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Добавить в избранное
  addToFavorites = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const serviceId = parseIdParam(req.params.service_id, 'service_id');
      
      await this.favoriteService.add(userId, serviceId);
      res.status(201).json(successResponse({ message: 'Added to favorites' }));
    } catch (error: any) {
      if (error.message === 'Service not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Service already in favorites') {
        res.status(409).json(errorResponse(409, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Удалить из избранного
  removeFromFavorites = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const serviceId = parseIdParam(req.params.service_id, 'service_id');
      
      await this.favoriteService.remove(userId, serviceId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Favorite not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };
}