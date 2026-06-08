import { Response } from 'express';
import { FavoriteService } from './favorite.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { parseIdParam } from '../../utils/parse-id-param';
import axios from 'axios';
import { settings } from '../../config/settings';

export class FavoriteController {
  private favoriteService: FavoriteService;

  constructor() {
    this.favoriteService = new FavoriteService();
  }

  getMyFavorites = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const { page, page_size } = getPaginationParams(
        req.query.page as any,
        req.query.page_size as any
      );
      
      const [favorites, total] = await this.favoriteService.findByUser(userId, page, page_size);
      
      const enriched = await Promise.all(favorites.map(async (fav) => {
        let serviceInfo = null;
        try {
          const response = await axios.get(`${settings.companyServiceUrl}/api/v1/services/${fav.service_id}`);
          serviceInfo = response.data.data;
        } catch (error) {
          // Service not found
        }
        
        return {
          service_id: fav.service_id,
          name: serviceInfo?.name || 'Unknown',
          company: {
            id: serviceInfo?.company_id || 0,
            title: serviceInfo?.company_title || 'Unknown',
          },
          price: serviceInfo?.price || 0,
          final_price: serviceInfo?.final_price || 0,
          avg_rating: null,
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