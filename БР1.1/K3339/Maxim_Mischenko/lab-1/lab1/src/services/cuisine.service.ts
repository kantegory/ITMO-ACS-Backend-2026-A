import { AppDataSource } from '../config/data-source';
import { Cuisine, CuisineResponse } from '../entities/Cuisine.entity';
import { AppError } from '../middleware/error-handler';

export class CuisineService {
  private cuisineRepository = AppDataSource.getRepository(Cuisine);

  async getAllCuisines(): Promise<CuisineResponse[]> {
    const cuisines = await this.cuisineRepository.find({
      order: { name: 'ASC' },
    });
    return cuisines.map(cuisine => cuisine.toResponse());
  }

  async createCuisine(name: string): Promise<CuisineResponse> {
    // Check if cuisine already exists
    const existingCuisine = await this.cuisineRepository.findOne({ where: { name } });
    if (existingCuisine) {
      throw new AppError('DUPLICATE_CUISINE', 'Cuisine with this name already exists', 400);
    }

    const cuisine = this.cuisineRepository.create({ name });
    await this.cuisineRepository.save(cuisine);
    return cuisine.toResponse();
  }

  async deleteCuisine(id: number): Promise<void> {
    const cuisine = await this.cuisineRepository.findOne({
      where: { id },
      relations: ['restaurants'],
    });

    if (!cuisine) {
      throw new AppError('CUISINE_NOT_FOUND', 'Cuisine not found', 404);
    }

    // Check if there are associated restaurants
    if (cuisine.restaurants && cuisine.restaurants.length > 0) {
      throw new AppError('CUISINE_IN_USE', 'Cannot delete cuisine with associated restaurants', 409);
    }

    await this.cuisineRepository.remove(cuisine);
  }

  async getCuisineById(id: number): Promise<Cuisine> {
    const cuisine = await this.cuisineRepository.findOne({ where: { id } });
    
    if (!cuisine) {
      throw new AppError('CUISINE_NOT_FOUND', 'Cuisine not found', 404);
    }

    return cuisine;
  }
}
