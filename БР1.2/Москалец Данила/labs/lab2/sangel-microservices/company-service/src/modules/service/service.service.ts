import { Repository, In } from 'typeorm';
import { Service } from '../../entities/service.entity';
import { ServiceCategory } from '../../entities/service-category.entity';
import { Discount } from '../../entities/discount.entity';
import { Company } from '../../entities/company.entity';
import { Category } from '../../entities/category.entity';
import { AppDataSource } from '../../config/database';
import { CreateServiceDto, UpdateServiceDto, ServiceListQuery } from './service.dto';
import { publishServiceCreated } from '../../events/company.publisher';

export class ServiceService {
  private serviceRepository: Repository<Service>;
  private serviceCategoryRepository: Repository<ServiceCategory>;
  private discountRepository: Repository<Discount>;
  private companyRepository: Repository<Company>;
  private categoryRepository: Repository<Category>;

  constructor() {
    this.serviceRepository = AppDataSource.getRepository(Service);
    this.serviceCategoryRepository = AppDataSource.getRepository(ServiceCategory);
    this.discountRepository = AppDataSource.getRepository(Discount);
    this.companyRepository = AppDataSource.getRepository(Company);
    this.categoryRepository = AppDataSource.getRepository(Category);
  }

  async findByCompanyId(
    companyId: number,
    page: number,
    pageSize: number,
    categoryId?: number,
    isPublished?: boolean,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<[Service[], number]> {
    const qb = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.service_categories', 'service_categories')
      .leftJoinAndSelect('service_categories.category', 'category')
      .leftJoinAndSelect('service.discount', 'discount')
      .where('service.company_id = :companyId', { companyId });

    if (isPublished !== undefined) {
      qb.andWhere('service.is_published = :isPublished', { isPublished });
    }

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    const allowedSortFields = ['created_at', 'name', 'base_price'];
    const orderBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(`service.${orderBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    return qb.getManyAndCount();
  }

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

  async isOwner(serviceId: number, userId: number): Promise<boolean> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['company'],
    });
    if (!service) return false;
    return service.company.user_id === userId;
  }

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
    await publishServiceCreated(savedService);  

    if (dto.category_ids && dto.category_ids.length > 0) {
      await this.addCategoriesToService(savedService.id, dto.category_ids);
    }

    return this.findById(savedService.id);
  }

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

  async delete(id: number): Promise<void> {
    const service = await this.findById(id);
    await this.serviceRepository.remove(service);
  }

  private async addCategoriesToService(serviceId: number, categoryIds: number[]): Promise<void> {
    const uniqueCategoryIds = [...new Set(categoryIds)];
    const existingCategories = await this.categoryRepository.find({
      where: { id: In(uniqueCategoryIds) },
    });

    if (existingCategories.length !== uniqueCategoryIds.length) {
      throw new Error('One or more categories not found');
    }

    const serviceCategories = uniqueCategoryIds.map((categoryId) => {
      return this.serviceCategoryRepository.create({
        service_id: serviceId,
        category_id: categoryId,
      });
    });

    await this.serviceCategoryRepository.save(serviceCategories);
  }

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

    if (search) {
      qb.andWhere('(service.name ILIKE :search OR service.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (company_id) {
      qb.andWhere('service.company_id = :companyId', { companyId: company_id });
    }

    if (category_id) {
      qb.andWhere('category.id = :categoryId', { categoryId: category_id });
    }

    if (price_min !== undefined) {
      qb.andWhere('service.base_price >= :priceMin', { priceMin: price_min });
    }
    if (price_max !== undefined) {
      qb.andWhere('service.base_price <= :priceMax', { priceMax: price_max });
    }

    if (with_discount) {
      qb.andWhere('discount.id IS NOT NULL');
      qb.andWhere('discount.start_at <= NOW()');
      qb.andWhere('discount.end_at >= NOW()');
    }

    const sortOrderDir = sort_order.toUpperCase() as 'ASC' | 'DESC';

    switch (sort_by) {
      case 'price':
        qb.orderBy('service.base_price', sortOrderDir);
        break;
      case 'final_price':
        qb.addSelect(
          'COALESCE(service.base_price * (100 - COALESCE(discount.percentage, 0)) / 100, service.base_price)',
          'final_price'
        );
        qb.orderBy('final_price', sortOrderDir);
        break;
      case 'rating':
        // Сортировка по рейтингу - пока используем created_at, т.к. рейтинг из другого сервиса
        qb.orderBy('service.created_at', sortOrderDir);
        break;
      default:
        qb.orderBy('service.created_at', sortOrderDir);
    }

    qb.skip((page - 1) * page_size).take(page_size);

    return qb.getManyAndCount();
  }

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