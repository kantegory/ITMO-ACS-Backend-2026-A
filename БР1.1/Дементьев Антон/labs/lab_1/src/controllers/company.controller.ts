import {
    Body,
    Delete,
    Get,
    JsonController,
    Param,
    Patch,
    Post,
    QueryParams,
    Req,
    Res,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response } from 'express';

import dataSource from '../config/data-source';
import { fail } from '../common/errors';
import { created, noContent } from '../common/http';
import { PageQuery, pageOptions, paginate } from '../common/pagination';
import { uuidParam } from '../common/validators';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto/company.dto';
import { CompanyVacanciesQuery } from '../dto/vacancy.dto';
import authMiddleware, { requireRole, RequestWithUser } from '../middlewares/auth.middleware';
import { Company } from '../models/company.entity';
import { Role } from '../models/enums';
import { Vacancy } from '../models/vacancy.entity';
import { loadOwnedCompany, requireIndustry } from '../services/access.service';
import { companyView, vacancyShortView } from '../views/vacancy.view';

const AUTH = { security: [{ bearerAuth: [] }] };
const EMPLOYER = [authMiddleware, requireRole(Role.EMPLOYER)];

@JsonController('/companies')
class CompanyController {
    private companies = () => dataSource.getRepository(Company);

    @Get('')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Мои компании', ...AUTH })
    async list(@Req() req: RequestWithUser, @QueryParams({ type: PageQuery }) query: PageQuery) {
        const [list, total] = await this.companies().findAndCount({
            where: { ownerUserId: req.user!.id },
            relations: { industry: true },
            order: { createdAt: 'DESC' },
            ...pageOptions(query),
        });
        return paginate(list.map(companyView), query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Создание компании', ...AUTH })
    async create(@Req() req: RequestWithUser, @Body({ type: CreateCompanyDto }) body: CreateCompanyDto, @Res() res: Response) {
        await requireIndustry(body.industry_id);
        const saved = await this.companies().save(
            this.companies().create({
                ownerUserId: req.user!.id,
                industryId: body.industry_id,
                name: body.name,
                description: body.description ?? null,
                websiteUrl: body.website_url ?? null,
            }),
        );
        const company = await loadOwnedCompany(saved.id, req.user!.id);
        return created(res, `/companies/${saved.id}`, companyView(company));
    }

    @Get('/:companyId')
    @OpenAPI({ summary: 'Страница компании' })
    async get(@Param('companyId') companyId: string) {
        const company = await this.companies().findOne({
            where: { id: uuidParam(companyId, 'COMPANY_NOT_FOUND') },
            relations: { industry: true },
        });
        if (!company) throw fail('COMPANY_NOT_FOUND');
        return companyView(company);
    }

    @Patch('/:companyId')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Редактирование компании', ...AUTH })
    async update(
        @Req() req: RequestWithUser,
        @Param('companyId') companyId: string,
        @Body({ type: UpdateCompanyDto }) body: UpdateCompanyDto,
    ) {
        const company = await loadOwnedCompany(companyId, req.user!.id);
        if (body.industry_id !== undefined) await requireIndustry(body.industry_id);

        if (body.name !== undefined) company.name = body.name;
        if (body.industry_id !== undefined) company.industryId = body.industry_id;
        if (body.description !== undefined) company.description = body.description;
        if (body.website_url !== undefined) company.websiteUrl = body.website_url;
        delete (company as any).industry;
        await this.companies().save(company);

        return companyView(await loadOwnedCompany(company.id, req.user!.id));
    }

    @Delete('/:companyId')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Удаление компании', ...AUTH })
    async remove(@Req() req: RequestWithUser, @Param('companyId') companyId: string, @Res() res: Response) {
        const company = await loadOwnedCompany(companyId, req.user!.id);
        if (await dataSource.getRepository(Vacancy).existsBy({ companyId: company.id })) {
            throw fail('COMPANY_HAS_VACANCIES');
        }
        await this.companies().delete(company.id);
        return noContent(res);
    }

    @Get('/:companyId/vacancies')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Вакансии компании (кабинет работодателя)', ...AUTH })
    async vacancies(
        @Req() req: RequestWithUser,
        @Param('companyId') companyId: string,
        @QueryParams({ type: CompanyVacanciesQuery }) query: CompanyVacanciesQuery,
    ) {
        const company = await loadOwnedCompany(companyId, req.user!.id);
        const [list, total] = await dataSource.getRepository(Vacancy).findAndCount({
            where: {
                companyId: company.id,
                ...(query.is_active !== undefined ? { isActive: query.is_active } : {}),
            },
            relations: { company: true, industry: true },
            order: { createdAt: 'DESC' },
            ...pageOptions(query),
        });
        return paginate(list.map(vacancyShortView), query.page, query.size, total);
    }
}

export default CompanyController;
