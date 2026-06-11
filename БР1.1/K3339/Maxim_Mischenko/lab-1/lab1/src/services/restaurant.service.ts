import { AppDataSource } from '../config/data-source';
import { Restaurant, RestaurantStatus } from '../entities/Restaurant.entity';
import { Cuisine } from '../entities/Cuisine.entity';
import { AppError } from '../middleware/error-handler';
import { WorkingHours } from '../entities/Restaurant.entity';

export class RestaurantService {
  private restaurantRepository = AppDataSource.getRepository(Restaurant);
  private cuisineRepository = AppDataSource.getRepository(Cuisine);

  async getAllRestaurants(
    filters?: {
      cuisineId?: number;
      city?: string;
      minPrice?: number;
      maxPrice?: number;
      status?: RestaurantStatus;
    },
    pagination?: { page: number; limit: number }
  ): Promise<{ total: number; items: any[] }> {
    const query = this.restaurantRepository.createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.cuisine', 'cuisine')
      .leftJoinAndSelect('restaurant.images', 'images')
      .leftJoinAndSelect('restaurant.reviews', 'reviews')
      .where('restaurant.status = :status', { status: RestaurantStatus.OPEN });

    if (filters?.cuisineId) {
      query.andWhere('restaurant.cuisine_id = :cuisineId', { cuisineId: filters.cuisineId });
    }
    if (filters?.city) {
      query.andWhere('restaurant.city ILIKE :city', { city: `%${filters.city}%` });
    }
    if (filters?.minPrice !== undefined) {
      query.andWhere('restaurant.avg_price_per_person >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters?.maxPrice !== undefined) {
      query.andWhere('restaurant.avg_price_per_person <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    // Get total count before pagination
    const total = await query.getCount();

    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      query.skip(skip).take(pagination.limit);
    }

    query.orderBy('restaurant.name', 'ASC');

    const restaurants = await query.getMany();
    return {
      total,
      items: restaurants.map(restaurant => restaurant.toListItemResponse())
    };
  }

  async getRestaurantById(id: number): Promise<any> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['cuisine', 'images', 'tables', 'menuItems', 'reviews', 'reviews.user'],
    });

    if (!restaurant) {
      throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404);
    }

    return restaurant.toDetailResponse();
  }

  async createRestaurant(data: {
    name: string;
    description?: string;
    cuisineId: number;
    city: string;
    address: string;
    avgPricePerPerson?: number;
    latitude?: number;
    longitude?: number;
    workingHours?: WorkingHours[];
  }): Promise<any> {
    // Validate cuisine exists
    const cuisine = await this.cuisineRepository.findOne({ where: { id: data.cuisineId } });
    if (!cuisine) {
      throw new AppError('CUISINE_NOT_FOUND', 'Cuisine not found', 404);
    }

    const restaurant = this.restaurantRepository.create({
      name: data.name,
      description: data.description,
      cuisine,
      city: data.city,
      address: data.address,
      avgPricePerPerson: data.avgPricePerPerson,
      latitude: data.latitude,
      longitude: data.longitude,
      workingHours: data.workingHours,
      status: RestaurantStatus.OPEN,
    });

    await this.restaurantRepository.save(restaurant);
    return restaurant.toDetailResponse();
  }

  async updateRestaurant(id: number, data: Partial<{
    name: string;
    description: string;
    cuisineId: number;
    city: string;
    address: string;
    avgPricePerPerson: number;
    latitude: number;
    longitude: number;
    workingHours: WorkingHours[];
    restaurant_status: RestaurantStatus;
  }>): Promise<any> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id } });
    if (!restaurant) {
      throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404);
    }

    if (data.cuisineId) {
      const cuisine = await this.cuisineRepository.findOne({ where: { id: data.cuisineId } });
      if (!cuisine) {
        throw new AppError('CUISINE_NOT_FOUND', 'Cuisine not found', 404);
      }
      restaurant.cuisine = cuisine;
    }

    Object.assign(restaurant, data);
    await this.restaurantRepository.save(restaurant);
    return restaurant.toDetailResponse();
  }

  async getRestaurantTables(id: number): Promise<any[]> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['tables'],
    });

    if (!restaurant) {
      throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404);
    }

    return restaurant.tables.map(table => table.toResponse());
  }

  async deleteRestaurant(id: number): Promise<void> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['bookings', 'reviews'],
    });

    if (!restaurant) {
      throw new AppError('RESTAURANT_NOT_FOUND', 'Restaurant not found', 404);
    }

    // Soft delete: set status to closed
    restaurant.status = RestaurantStatus.CLOSED;
    await this.restaurantRepository.save(restaurant);
  }
}