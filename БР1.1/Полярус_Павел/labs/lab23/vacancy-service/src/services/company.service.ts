import { ILike } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Company } from '../entities/Company';
import { CreateCompanyDto } from '../dto/CreateCompanyDto';
import { AppError } from '../utils/errors';

function toDetail(c: Company) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    website: c.website,
    logoUrl: c.logo_url,
    industryId: c.industry_id,
    cityId: c.city_id,
    updatedAt: c.updated_at,
  };
}

export class CompanyService {
  private companyRepo = AppDataSource.getRepository(Company);

  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const where: Record<string, unknown> = {};
    if (query.search) where.name = ILike(`%${query.search}%`);

    const [companies, total] = await this.companyRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      data: companies.map((c) => ({ id: c.id, name: c.name, logoUrl: c.logo_url })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new AppError(404, 'Company not found');
    return toDetail(company);
  }

  async create(dto: CreateCompanyDto) {
    const company = this.companyRepo.create({
      name: dto.name,
      description: dto.description ?? null,
      website: dto.website ?? null,
      logo_url: dto.logoUrl ?? null,
      industry_id: dto.industryId ?? null,
      city_id: dto.cityId ?? null,
    });
    await this.companyRepo.save(company);
    return toDetail(company);
  }

  async update(companyId: string, employerCompanyId: string | null, dto: CreateCompanyDto) {
    if (employerCompanyId !== companyId) throw new AppError(403, 'Forbidden');

    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new AppError(404, 'Company not found');

    if (dto.name !== undefined) company.name = dto.name;
    if (dto.description !== undefined) company.description = dto.description ?? null;
    if (dto.website !== undefined) company.website = dto.website ?? null;
    if (dto.logoUrl !== undefined) company.logo_url = dto.logoUrl ?? null;
    if (dto.industryId !== undefined) company.industry_id = dto.industryId ?? null;
    if (dto.cityId !== undefined) company.city_id = dto.cityId ?? null;

    await this.companyRepo.save(company);
    return toDetail(company);
  }
}
