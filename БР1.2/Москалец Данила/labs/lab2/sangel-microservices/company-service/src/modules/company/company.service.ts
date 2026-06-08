import { Repository, ILike } from 'typeorm';
import { Company } from '../../entities/company.entity';
import { Service } from '../../entities/service.entity';
import { AppDataSource } from '../../config/database';
import { CreateCompanyDto, UpdateCompanyDto, CompanyResponse, CompanyDetailResponse } from './company.dto';
import { publishCompanyCreated } from '../../events/company.publisher';


export class CompanyService {
  private companyRepository: Repository<Company>;
  private serviceRepository: Repository<Service>;

  constructor() {
    this.companyRepository = AppDataSource.getRepository(Company);
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  private async getTotalServices(companyId: number): Promise<number> {
    return this.serviceRepository.count({
      where: { company_id: companyId, is_published: true },
    });
  }

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

  private async enrichCompanyResponse(company: Company): Promise<CompanyResponse> {
    const totalServices = await this.getTotalServices(company.id);

    return {
      id: company.id,
      title: company.title,
      description: company.description,
      logo_url: company.logo_url,
      website: company.website,
      avg_rating: null,
      total_reviews: 0,
      total_services: totalServices,
      created_at: company.created_at,
    };
  }

  private async enrichCompanyDetailResponse(company: Company): Promise<CompanyDetailResponse> {
    const base = await this.enrichCompanyResponse(company);
    const servicesPreview = await this.getServicesPreview(company.id);

    return {
      ...base,
      owner: {
        id: company.user_id,
        first_name: '',
        last_name: '',
      },
      services_preview: servicesPreview,
    };
  }

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

  async findById(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    return company;
  }

  async findByUserId(userId: number): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { user_id: userId },
    });
  }

  async create(userId: number, dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      throw new Error('User already owns a company');
    }

    const company = this.companyRepository.create({
      ...dto,
      user_id: userId,
    });
    
    return this.companyRepository.save(company);
    await publishCompanyCreated(company);
  }

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

  async delete(id: number, userId: number, isAdmin: boolean): Promise<void> {
    const company = await this.findById(id);
    
    if (company.user_id !== userId && !isAdmin) {
      throw new Error('Forbidden');
    }
    
    await this.companyRepository.remove(company);
  }

  async getCompanyResponse(id: number): Promise<CompanyDetailResponse> {
    const company = await this.findById(id);
    return this.enrichCompanyDetailResponse(company);
  }
}