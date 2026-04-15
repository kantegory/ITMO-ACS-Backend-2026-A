import {
    Body,
    Delete,
    ForbiddenError,
    Get,
    JsonController,
    NotFoundError,
    Param,
    Post,
    Put,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsOptional, IsString, IsUrl } from 'class-validator';

import ConflictError from '../common/conflict-error';
import dataSource from '../config/data-source';
import { UserRole } from '../enums/role.enum';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { Company } from '../models/company.entity';
import { Service } from '../models/service.entity';
import { User } from '../models/user.entity';
import { getPagination } from '../utils/pagination';
import { paginatedResponse, successResponse } from '../utils/response';
import {
    getCompanyAverageRating,
    serializeCompany,
    serializeCompanyDetail,
} from '../utils/serializers';

class CompanyDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    logo?: string;

    @IsOptional()
    @IsUrl()
    website?: string;
}

@JsonController('/companies')
@UseBefore(AuthMiddleware)
class CompaniesController {
    private companyRepository = dataSource.getRepository(Company);

    private userRepository = dataSource.getRepository(User);

    private async loadCompany(id: number) {
        return this.companyRepository.findOne({
            where: { id },
            relations: {
                owner: true,
                services: {
                    company: true,
                    categories: true,
                    discount: true,
                    reviews: {
                        user: true,
                    },
                },
            },
        });
    }

    private ensureCanManageCompany(user: RequestWithUser['user'], company: Company) {
        if (user.role === UserRole.ADMIN || company.owner.id === user.id) {
            return;
        }

        throw new ForbiddenError('Access denied');
    }

    @Get()
    async list(@QueryParams() query: any) {
        const { limit, offset } = getPagination(query);
        const companies = await this.companyRepository.find({
            relations: {
                owner: true,
                services: {
                    company: true,
                    categories: true,
                    discount: true,
                    reviews: true,
                },
            },
            order: {
                createdAt: 'DESC',
            },
        });

        let filtered = companies;

        if (query.search) {
            const search = String(query.search).toLowerCase();
            filtered = filtered.filter((company) =>
                company.title.toLowerCase().includes(search),
            );
        }

        if (query.category_id) {
            const categoryId = Number(query.category_id);
            filtered = filtered.filter((company) =>
                (company.services ?? []).some((service) =>
                    (service.categories ?? []).some(
                        (category) => category.id === categoryId,
                    ),
                ),
            );
        }

        if (query.price_min !== undefined) {
            const priceMin = Number(query.price_min);
            filtered = filtered.filter((company) =>
                (company.services ?? []).some(
                    (service) => Number(service.price) >= priceMin,
                ),
            );
        }

        if (query.price_max !== undefined) {
            const priceMax = Number(query.price_max);
            filtered = filtered.filter((company) =>
                (company.services ?? []).some(
                    (service) => Number(service.price) <= priceMax,
                ),
            );
        }

        if (query.sort_by === 'rating') {
            const direction = query.sort_order === 'desc' ? -1 : 1;
            filtered = filtered.sort(
                (a, b) =>
                    direction *
                    (getCompanyAverageRating(a) - getCompanyAverageRating(b)),
            );
        }

        if (query.sort_by === 'price') {
            const direction = query.sort_order === 'desc' ? -1 : 1;
            filtered = filtered.sort((a, b) => {
                const aPrice = Math.min(
                    ...(a.services ?? []).map((service) => Number(service.price)),
                );
                const bPrice = Math.min(
                    ...(b.services ?? []).map((service) => Number(service.price)),
                );

                return direction * ((aPrice || 0) - (bPrice || 0));
            });
        }

        const total = filtered.length;
        const data = filtered.slice(offset, offset + limit).map(serializeCompany);

        return paginatedResponse(data, total, offset, limit);
    }

    @Post()
    async create(
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: CompanyDto }) body: CompanyDto,
    ) {
        const existingCompany = await this.companyRepository.findOne({
            where: {
                owner: { id: req.user.id },
            },
        });

        if (existingCompany) {
            throw new ConflictError('User already owns a company');
        }

        const owner = await this.userRepository.findOneByOrFail({ id: req.user.id });
        const company = this.companyRepository.create({
            title: body.title,
            description: body.description,
            logo: body.logo,
            website: body.website,
            owner,
        });

        const createdCompany = await this.companyRepository.save(company);

        if (owner.role === UserRole.USER) {
            owner.role = UserRole.OWNER;
            await this.userRepository.save(owner);
        }

        const loadedCompany = await this.loadCompany(createdCompany.id);

        return successResponse(serializeCompany(loadedCompany!));
    }

    @Get('/:id')
    async getOne(@Param('id') id: number) {
        const company = await this.loadCompany(Number(id));

        if (!company) {
            throw new NotFoundError('Company not found');
        }

        return successResponse(serializeCompanyDetail(company));
    }

    @Put('/:id')
    async update(
        @Param('id') id: number,
        @Req() req: RequestWithUser,
        @Body({ validate: true, type: CompanyDto }) body: CompanyDto,
    ) {
        const company = await this.loadCompany(Number(id));

        if (!company) {
            throw new NotFoundError('Company not found');
        }

        this.ensureCanManageCompany(req.user, company);

        company.title = body.title ?? company.title;
        company.description = body.description ?? company.description;
        company.logo = body.logo ?? company.logo;
        company.website = body.website ?? company.website;

        await this.companyRepository.save(company);

        return successResponse(serializeCompany(company));
    }

    @Delete('/:id')
    async remove(@Param('id') id: number, @Req() req: RequestWithUser) {
        const company = await this.loadCompany(Number(id));

        if (!company) {
            throw new NotFoundError('Company not found');
        }

        this.ensureCanManageCompany(req.user, company);
        await this.companyRepository.remove(company);

        if (req.user.role !== UserRole.ADMIN) {
            const otherCompany = await this.companyRepository.findOne({
                where: {
                    owner: { id: req.user.id },
                },
            });

            if (!otherCompany) {
                const user = await this.userRepository.findOneBy({ id: req.user.id });

                if (user && user.role === UserRole.OWNER) {
                    user.role = UserRole.USER;
                    await this.userRepository.save(user);
                }
            }
        }

        return successResponse({}, 'Company deleted');
    }
}

export default CompaniesController;
