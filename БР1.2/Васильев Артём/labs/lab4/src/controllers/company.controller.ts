import {
    Body,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { ILike } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import { ensureForbidden, ensureFound } from '../common/http-errors';
import { Company } from '../models/company.entity';
import { EmployerProfile } from '../models/employer-profile.entity';
import { UserRole } from '../models/enums/user-role.enum';
import {
    CompanyListQueryDto,
    CreateCompanyDto,
    UpdateCompanyDto,
} from '../dto/company.dto';

@EntityController({
    baseRoute: '/companies',
    entity: Company,
})
class CompanyController extends BaseController {
    private employerProfileRepository =
        dataSource.getRepository(EmployerProfile);

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateCompanyDto }) payload: CreateCompanyDto,
    ) {
        ensureForbidden(
            [UserRole.EMPLOYER, UserRole.ADMIN].includes(request.user.role),
            'Only employer or admin can create company',
        );

        const company = this.repository.create({
            title: payload.title,
            description: payload.description ?? null,
            website: payload.website ?? null,
            industryText: payload.industry_text ?? null,
            address: payload.address ?? null,
            employeeCount: payload.employee_count ?? null,
        });

        return await this.repository.save(company);
    }

    @Get('')
    async list(
        @QueryParams({ type: CompanyListQueryDto }) query: CompanyListQueryDto,
    ) {
        const { page, limit, skip } = resolvePagination(query);
        const searchValue = query.title ?? query.search;
        const where = searchValue
            ? {
                  title: ILike(`%${searchValue}%`),
              }
            : {};

        const [items, total] = await this.repository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            take: limit,
            skip,
        });

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Get('/:company_id')
    async getById(@Param('company_id') companyId: string) {
        return ensureFound(
            await this.repository.findOneBy({ id: companyId }),
            'Company not found',
        );
    }

    @Patch('/:company_id')
    @UseBefore(authMiddleware)
    async update(
        @Param('company_id') companyId: string,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateCompanyDto }) payload: UpdateCompanyDto,
    ) {
        const company = ensureFound(
            await this.repository.findOneBy({ id: companyId }),
            'Company not found',
        ) as Company;

        if (request.user.role !== UserRole.ADMIN) {
            const ownedProfile = await this.employerProfileRepository.findOneBy(
                {
                    userId: request.user.id,
                    companyId,
                },
            );

            ensureForbidden(
                !!ownedProfile && request.user.role === UserRole.EMPLOYER,
                'Only owner employer can update company',
            );
        }

        Object.assign(company, {
            title: payload.title ?? company.title,
            description:
                payload.description !== undefined
                    ? payload.description
                    : company.description,
            website:
                payload.website !== undefined
                    ? payload.website
                    : company.website,
            industryText:
                payload.industry_text !== undefined
                    ? payload.industry_text
                    : company.industryText,
            address:
                payload.address !== undefined
                    ? payload.address
                    : company.address,
            employeeCount:
                payload.employee_count !== undefined
                    ? payload.employee_count
                    : company.employeeCount,
        });

        return await this.repository.save(company);
    }
}

export default CompanyController;
