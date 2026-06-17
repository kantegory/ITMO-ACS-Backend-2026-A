import { ILike } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Company } from '../entities/Company';
import { Employer } from '../entities/Employer';
import { CreateCompanyDto } from '../dto/CreateCompanyDto';
import { AppError } from '../utils/errors';

const relations = {
  industry: true,
  city: { country: true },
} as const;

function toDetail(company: Company) {
  return {
    id: company.id,
    name: company.name,
    description: company.description,
    website: company.website,
    logoUrl: company.logo_url,
    industry: company.industry
      ? { id: company.industry.id, name: company.industry.name }
      : null,
    city: company.city
      ? {
          id: company.city.id,
          name: company.city.name,
          country: company.city.country
            ? { id: company.city.country.id, name: company.city.country.name }
            : null,
        }
      : null,
  };
}

export class CompanyService {
  private companyRepo = AppDataSource.getRepository(Company);
  private employerRepo = AppDataSource.getRepository(Employer);

  async findAll(query: {
    search?: string;
    industryId?: string;
    cityId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const where: Record<string, unknown> = {};
    if (query.search) where.name = ILike(`%${query.search}%`);
    if (query.industryId) where.industry_id = query.industryId;
    if (query.cityId) where.city_id = query.cityId;

    const [companies, total] = await this.companyRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data: companies.map((c) => ({
        id: c.id,
        name: c.name,
        logoUrl: c.logo_url,
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const company = await this.companyRepo.findOne({ where: { id }, relations });
    if (!company) throw new AppError(404, 'Company not found');
    return toDetail(company);
  }

  async create(userId: string, dto: CreateCompanyDto) {
    const company = this.companyRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      website: dto.website ?? null,
      logo_url: dto.logoUrl ?? null,
      industry_id: dto.industryId ?? null,
      city_id: dto.cityId ?? null,
    });
    await this.companyRepo.save(company);

    await this.employerRepo.update({ user_id: userId }, { company_id: company.id });

    const saved = await this.companyRepo.findOne({ where: { id: company.id }, relations });
    return toDetail(saved!);
  }

  async update(companyId: string, userId: string, dto: CreateCompanyDto) {
    const employer = await this.employerRepo.findOne({ where: { user_id: userId } });
    if (!employer || employer.company_id !== companyId) {
      throw new AppError(403, 'Forbidden');
    }

    const company = await this.companyRepo.findOne({ where: { id: companyId }, relations });
    if (!company) throw new AppError(404, 'Company not found');

    if (dto.name !== undefined) company.name = dto.name;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.website !== undefined) company.website = dto.website;
    if (dto.logoUrl !== undefined) company.logo_url = dto.logoUrl;
    if (dto.industryId !== undefined) company.industry_id = dto.industryId;
    if (dto.cityId !== undefined) company.city_id = dto.cityId;

    await this.companyRepo.save(company);
    const saved = await this.companyRepo.findOne({ where: { id: companyId }, relations });
    return toDetail(saved!);
  }
}
