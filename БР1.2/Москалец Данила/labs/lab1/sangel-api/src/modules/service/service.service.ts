// src/modules/service/service.service.ts
import { Repository, ILike, Between, In, FindOptionsWhere } from 'typeorm';
import { Service } from './service.entity';
import { ServiceCategory } from './service-category.entity';
import { Discount } from '../discount/discount.entity';
import { Company } from '../company/company.entity';
import { Category } from '../category/category.entity';
import { AppDataSource } from '../../config/database';
import { CreateServiceDto, UpdateServiceDto, ServiceListQuery } from './service.dto';
import { Review } from '../review/review.entity';

export class ServiceService {
  private serviceRepository: Repository<Service>;
  private serviceCategoryRepository: Repository<ServiceCategory>;
  private discountRepository: Repository<Discount>;
  private companyRepository: Repository<Company>;
  private categoryRepository: Repository<Category>;
  private reviewRepository: Repository<Review>;

  constructor() {
    this.serviceRepository = AppDataSource.getRepository(Service);
    this.serviceCategoryRepository = AppDataSource.getRepository(ServiceCategory);
    this.discountRepository = AppDataSource.getRepository(Discount);
    this.companyRepository = AppDataSource.getRepository(Company);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.reviewRepository = AppDataSource.getRepository(Review);
  }

  // Получить услуги компании (с пагинацией и фильтрацией)
  async findByCompanyId(
    companyId: number,
    page: number,
    pageSize: number,
    categoryId?: number,
    isPublished?: boolean,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<[Service[], number]> {
    const where: FindOptionsWhere<Service> = { company_id: companyId };
    
    if (isPublished !== undefined) {
      where.is_published = isPublished;
    }

    const [services, total] = await this.serviceRepository.findAndCount({
      where,
      relations: ['service_categories', 'service_categories.category', 'discount'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { [sortBy]: sortOrder },
    });

    // Фильтрация по категориям (на уровне приложения, т.к. связь многие-ко-многим)
    let filteredServices = services;
    if (categoryId) {
      filteredServices = services.filter(service =>
        service.service_categories?.some(sc => sc.category_id === categoryId)
      );
    }

    return [filteredServices, filteredServices.length];
  }

  // Получить услугу по ID
  async findById(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['company', 'service_categories', 'service_categories.category', 'discount'],
    });
    if (!service) {
      throw new Error('Service not found');
    }
    return service;
  }

  // Проверить, является ли пользователь владельцем услуги
  async isOwner(serviceId: number, userId: number): Promise<boolean> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['company'],
    });
    if (!service) return false;
    return service.company.user_id === userId;
  }

  // Создать услугу
  async create(companyId: number, dto: CreateServiceDto): Promise<Service> {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new Error('Company not found');
    }

    const service = this.serviceRepository.create({
      company_id: companyId,
      name: dto.name,
      description: dto.description || null,
      base_price: dto.price,
      is_published: dto.is_published ?? true,
    });

    const savedService = await this.serviceRepository.save(service);

    if (dto.category_ids && dto.category_ids.length > 0) {
      await this.addCategoriesToService(savedService.id, dto.category_ids);
    }

    return this.findById(savedService.id);
  }

  // Обновить услугу
  async update(id: number, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id);

    if (dto.name !== undefined) service.name = dto.name;
    if (dto.description !== undefined) service.description = dto.description;
    if (dto.price !== undefined) service.base_price = dto.price;
    if (dto.is_published !== undefined) service.is_published = dto.is_published;

    await this.serviceRepository.save(service);

    if (dto.category_ids !== undefined) {
      await this.serviceCategoryRepository.delete({ service_id: id });
      if (dto.category_ids.length > 0) {
        await this.addCategoriesToService(id, dto.category_ids);
      }
    }

    return this.findById(id);
  }

  // Удалить услугу
  async delete(id: number): Promise<void> {
    const service = await this.findById(id);
    await this.serviceRepository.remove(service);
  }

  // Добавить категории к услуге
  private async addCategoriesToService(serviceId: number, categoryIds: number[]): Promise<void> {
    const serviceCategories = categoryIds.map(categoryId => {
      return this.serviceCategoryRepository.create({
        service_id: serviceId,
        category_id: categoryId,
      });
    });
    await this.serviceCategoryRepository.save(serviceCategories);
  }

  // Каталог услуг (с фильтрацией, поиском, сортировкой)
  async getCatalog(query: ServiceListQuery): Promise<[Service[], number]> {
    const {
      page,
      page_size,
      search,
      company_id,
      category_id,
      price_min,
      price_max,
      with_discount,
      sort_by,
      sort_order,
    } = query;

    const qb = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.company', 'company')
      .leftJoinAndSelect('service.service_categories', 'service_categories')
      .leftJoinAndSelect('service_categories.category', 'category')
      .leftJoinAndSelect('service.discount', 'discount')
      .where('service.is_published = :published', { published: true });

    // Поиск по названию или описанию
    if (search) {
      qb.andWhere('(service.name ILIKE :search OR service.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Фильтр по компании
    if (company_id) {
      qb.andWhere('service.company_id = :companyId', { companyId: company_id });
    }

    // Фильтр по категории
    if (category_id) {
      qb.andWhere('category.id = :categoryId', { categoryId: category_id });
    }

    // Фильтр по цене
    if (price_min !== undefined) {
      qb.andWhere('service.base_price >= :priceMin', { priceMin: price_min });
    }
    if (price_max !== undefined) {
      qb.andWhere('service.base_price <= :priceMax', { priceMax: price_max });
    }

    // Фильтр по скидке
    if (with_discount) {
      qb.andWhere('discount.id IS NOT NULL');
      qb.andWhere('discount.start_at <= NOW()');
      qb.andWhere('discount.end_at >= NOW()');
    }

    // Сортировка - ТЕПЕРЬ С ПОДДЕРЖКОЙ РЕЙТИНГА
    const sortOrderDir = sort_order.toUpperCase() as 'ASC' | 'DESC';
    
    switch (sort_by) {
      case 'price':
        qb.orderBy('service.base_price', sortOrderDir);
        break;
      case 'final_price':
        qb.addSelect('COALESCE(service.base_price * (100 - COALESCE(discount.percentage, 0)) / 100, service.base_price)', 'final_price');
        qb.orderBy('final_price', sortOrderDir);
        break;
      case 'rating':
        qb.leftJoin(
          (subQb) => {
            return subQb
              .select('review.service_id', 'service_id')
              .addSelect('AVG(review.rating)', 'avg_rating')
              .from(Review, 'review')
              .groupBy('review.service_id');
          },
          'rating_stats',
          'rating_stats.service_id = service.id'
        );
        qb.addSelect('COALESCE(rating_stats.avg_rating, 0)', 'service_rating');
        qb.orderBy('service_rating', sortOrderDir);
        break;
      default:
        qb.orderBy('service.created_at', sortOrderDir);
    }

    // Пагинация
    const skip = (page - 1) * page_size;
    qb.skip(skip).take(page_size);

    const [services, total] = await qb.getManyAndCount();

    return [services, total];
  }

  // Получить услуги компании для публичного просмотра
  async getCompanyServicesPublic(
    companyId: number,
    page: number,
    pageSize: number,
    categoryId?: number,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<[Service[], number]> {
    return this.findByCompanyId(companyId, page, pageSize, categoryId, true, sortBy, sortOrder);
  }
}