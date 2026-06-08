import { Repository } from 'typeorm';
import { Favorite } from '../../entities/favorite.entity';
import { AppDataSource } from '../../config/database';
import axios from 'axios';
import { settings } from '../../config/settings';

export class FavoriteService {
  private favoriteRepository: Repository<Favorite>;

  constructor() {
    this.favoriteRepository = AppDataSource.getRepository(Favorite);
  }

  private async checkServiceExists(serviceId: number): Promise<boolean> {
    try {
      const response = await axios.get(`${settings.companyServiceUrl}/api/v1/services/${serviceId}`);
      return !!response.data.data;
    } catch (error) {
      return false;
    }
  }

  async findByUser(userId: number, page: number, pageSize: number): Promise<[Favorite[], number]> {
    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { user_id: userId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { created_at: 'DESC' },
    });
    
    return [favorites, total];
  }

  async add(userId: number, serviceId: number): Promise<Favorite> {
    const serviceExists = await this.checkServiceExists(serviceId);
    if (!serviceExists) {
      throw new Error('Service not found');
    }

    const existing = await this.favoriteRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
    });
    if (existing) {
      throw new Error('Service already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      user_id: userId,
      service_id: serviceId,
    });
    
    return this.favoriteRepository.save(favorite);
  }

  async remove(userId: number, serviceId: number): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
    });
    
    if (!favorite) {
      throw new Error('Favorite not found');
    }
    
    await this.favoriteRepository.remove(favorite);
  }

  async isFavorite(userId: number, serviceId: number): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { user_id: userId, service_id: serviceId },
    });
    return !!favorite;
  }
}