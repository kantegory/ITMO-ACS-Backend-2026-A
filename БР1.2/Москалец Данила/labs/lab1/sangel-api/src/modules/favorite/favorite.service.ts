import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Service } from '../service/service.entity';
import { AppDataSource } from '../../config/database';

export class FavoriteService {
  private favoriteRepository: Repository<Favorite>;
  private serviceRepository: Repository<Service>;

  constructor() {
    this.favoriteRepository = AppDataSource.getRepository(Favorite);
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  async findByUser(userId: number, page: number, pageSize: number): Promise<[Favorite[], number]> {
    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { user_id: userId },
      relations: ['service', 'service.company', 'service.discount', 'service.service_categories'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { created_at: 'DESC' },
    });
    
    return [favorites, total];
  }

  async add(userId: number, serviceId: number): Promise<Favorite> {
    // Проверяем существование услуги
    const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new Error('Service not found');
    }

    // Проверяем, не добавлено ли уже в избранное
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