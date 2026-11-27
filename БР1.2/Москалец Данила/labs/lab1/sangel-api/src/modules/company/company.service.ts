// src/modules/company/company.service.ts
import { Repository, ILike } from 'typeorm';
import { Company } from './company.entity';
import { User, UserRole } from '../user/user.entity';
import { Service } from '../service/service.entity';
import { Review } from '../review/review.entity';
import { AppDataSource } from '../../config/database';
import { CreateCompanyDto, UpdateCompanyDto, CompanyResponse, CompanyDetailResponse } from './company.dto';

export class CompanyService {
  private companyRepository: Repository<Company>;
  private userRepository: Repository<User>;
  private serviceRepository: Repository<Service>;
  private reviewRepository: Repository<Review>;

  constructor() {
    this.companyRepository = AppDataSource.getRepository(Company);
    this.userRepository = AppDataSource.getRepository(User);
    this.serviceRepository = AppDataSource.getRepository(Service);
    this.reviewRepository = AppDataSource.getRepository(Review);
  }

  /**
   * Получить количество услуг компании
   */
  private async getTotalServices(companyId: number): Promise<number> {
    return this.serviceRepository.count({
      where: { company_id: companyId, is_published: true },
    });
  }

  /**
   * Получить средний рейтинг компании (на основе отзывов об услугах)
   */
  private async getCompanyRating(companyId: number): Promise<{ avg_rating: number | null; total_reviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.service', 'service')
      .where('service.company_id = :companyId', { companyId })
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .getRawOne();

    return {
      avg_rating: result?.avg_rating ? parseFloat(result.avg_rating) : null,
      total_reviews: result?.total_reviews ? parseInt(result.total_reviews) : 0,
    };
  }

  /**
   * Получить превью услуг компании (первые 5)
   */
  private async getServicesPreview(companyId: number): Promise<any[]> {
    const services = await this.serviceRepository.find({
      where: { company_id: companyId, is_published: true },
      relations: ['discount', 'service_categories', 'service_categories.category'],
      take: 5,
      order: { created_at: 'DESC' },
    });

    return services.map(service => {
      const discount = service.discount;
      const isDiscountActive = discount 
        ? new Date() >= discount.start_at && new Date() <= discount.end_at
        : false;
      
      // Безопасное вычисление финальной цены с проверкой на null
      const finalPrice = isDiscountActive && discount
        ? Number(service.base_price) * (100 - discount.percentage) / 100 
        : Number(service.base_price);

      return {
        id: service.id,
        name: service.name,
        price: Number(service.base_price),
        final_price: finalPrice,
        discount_percentage: isDiscountActive && discount ? discount.percentage : null,
        is_published: service.is_published,
        categories: service.service_categories?.map(sc => ({
          id: sc.category.id,
          title: sc.category.title,
        })) || [],
        avg_rating: null,
        total_reviews: 0,
      };
    });
  }

  /**
   * Обогатить компанию дополнительной информацией для базового ответа
   */
  private async enrichCompanyResponse(company: Company): Promise<CompanyResponse> {
    const totalServices = await this.getTotalServices(company.id);
    const { avg_rating, total_reviews } = await this.getCompanyRating(company.id);

    return {
      id: company.id,
      title: company.title,
      description: company.description,
      logo_url: company.logo_url,
      website: company.website,
      avg_rating,
      total_reviews,
      total_services: totalServices,
      created_at: company.created_at,
    };
  }

  /**
   * Обогатить компанию дополнительной информацией для детального ответа
   */
  private async enrichCompanyDetailResponse(company: Company): Promise<CompanyDetailResponse> {
    const base = await this.enrichCompanyResponse(company);
    const user = await this.userRepository.findOne({ where: { id: company.user_id } });
    const servicesPreview = await this.getServicesPreview(company.id);

    return {
      ...base,
      owner: {
        id: user?.id || 0,
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
      },
      services_preview: servicesPreview,
    };
  }

  /**
   * Получить список компаний (публичный) с пагинацией и фильтрацией
   */
  async findAll(
    page: number, 
    pageSize: number, 
    search?: string, 
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<[Company[], number]> {
    const where: any = {};
    
    if (search) {
      where.title = ILike(`%${search}%`);
    }
    
    const allowedSortFields = ['created_at', 'title'];
    const orderBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    
    const [companies, total] = await this.companyRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { [orderBy]: sortOrder },
    });
    
    return [companies, total];
  }

  /**
   * Найти компанию по ID
   */
  async findById(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  }

  /**
   * Найти компанию по ID пользователя
   */
  async findByUserId(userId: number): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { user_id: userId },
    });
  }

  /**
   * Создать компанию
   */
  async create(userId: number, dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      throw new Error('User already owns a company');
    }

    await this.userRepository.update(userId, { role: UserRole.OWNER });

    const company = this.companyRepository.create({
      ...dto,
      user_id: userId,
    });
    
    return this.companyRepository.save(company);
  }

  /**
   * Обновить компанию
   */
  async update(id: number, userId: number, dto: UpdateCompanyDto, isAdmin: boolean): Promise<Company> {
    const company = await this.findById(id);
    
    if (company.user_id !== userId && !isAdmin) {
      throw new Error('Forbidden');
    }
    
    if (dto.title !== undefined) company.title = dto.title;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.logo_url !== undefined) company.logo_url = dto.logo_url;
    if (dto.website !== undefined) company.website = dto.website;
    
    return this.companyRepository.save(company);
  }

  /**
   * Удалить компанию
   */
  async delete(id: number, userId: number, isAdmin: boolean): Promise<void> {
    const company = await this.findById(id);
    
    if (company.user_id !== userId && !isAdmin) {
      throw new Error('Forbidden');
    }
    
    await this.userRepository.update(company.user_id, { role: UserRole.USER });
    await this.companyRepository.remove(company);
  }

  /**
   * Получить обогащенный ответ компании по ID
   */
  async getCompanyResponse(id: number): Promise<CompanyDetailResponse> {
    const company = await this.findById(id);
    return this.enrichCompanyDetailResponse(company);
  }

  /**
   * Получить список компаний для администратора (без фильтрации по публикации)
   */
  async findAllAdmin(
    page: number, 
    pageSize: number, 
    search?: string, 
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<[Company[], number]> {
    const where: any = {};
    
    if (search) {
      where.title = ILike(`%${search}%`);
    }
    
    const allowedSortFields = ['created_at', 'title'];
    const orderBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    
    const [companies, total] = await this.companyRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { [orderBy]: sortOrder },
    });
    
    return [companies, total];
  }
}