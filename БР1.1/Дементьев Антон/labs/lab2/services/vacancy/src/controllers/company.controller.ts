import { Body, Delete, Get, JsonController, Param, Patch, Post, QueryParams, Req, Res, UseBefore } from 'routing-controllers';
import { Response } from 'express';
import { created, fail, noContent, PageQuery, pageOptions, paginate, Role, uuidParam } from '@jobsearch/common';

import { dataSource } from '../db';
import { CreateCompanyDto, UpdateCompanyDto } from '../dto/company.dto';
import { CompanyVacanciesQuery } from '../dto/vacancy.dto';
import { authMiddleware, requireRole, RequestWithUser } from '../auth';
import { Company } from '../models/company.entity';
import { Vacancy } from '../models/vacancy.entity';
import { companyView, industriesFor, loadOwnedCompany, requireIndustry, vacancyShortView } from '../support';

const EMPLOYER = [authMiddleware, requireRole(Role.EMPLOYER)];

@JsonController('/api/v1/companies')
class CompanyController {
    private companies = () => dataSource.getRepository(Company);

    @Get('')
    @UseBefore(...EMPLOYER)
    async list(@Req() req: RequestWithUser, @QueryParams({ type: PageQuery }) query: PageQuery) {
        const [list, total] = await this.companies().findAndCount({ where: { ownerUserId: req.user!.id }, order: { createdAt: 'DESC' }, ...pageOptions(query) });
        const ind = await industriesFor([], list);
        return paginate(list.map((c) => companyView(c, ind)), query.page, query.size, total);
    }

    @Post('')
    @UseBefore(...EMPLOYER)
    async create(@Req() req: RequestWithUser, @Body({ type: CreateCompanyDto }) body: CreateCompanyDto, @Res() res: Response) {
        await requireIndustry(body.industry_id);
        const saved = await this.companies().save(this.companies().create({
            ownerUserId: req.user!.id, industryId: body.industry_id, name: body.name, description: body.description ?? null, websiteUrl: body.website_url ?? null,
        }));
        return created(res, `/companies/${saved.id}`, companyView(saved, await industriesFor([], [saved])));
    }

    @Get('/:companyId')
    async get(@Param('companyId') companyId: string) {
        const c = await this.companies().findOneBy({ id: uuidParam(companyId, 'COMPANY_NOT_FOUND') });
        if (!c) throw fail('COMPANY_NOT_FOUND');
        return companyView(c, await industriesFor([], [c]));
    }

    @Patch('/:companyId')
    @UseBefore(...EMPLOYER)
    async update(@Req() req: RequestWithUser, @Param('companyId') companyId: string, @Body({ type: UpdateCompanyDto }) body: UpdateCompanyDto) {
        const c = await loadOwnedCompany(companyId, req.user!.id);
        if (body.industry_id !== undefined) await requireIndustry(body.industry_id);
        if (body.name !== undefined) c.name = body.name;
        if (body.industry_id !== undefined) c.industryId = body.industry_id;
        if (body.description !== undefined) c.description = body.description;
        if (body.website_url !== undefined) c.websiteUrl = body.website_url;
        await this.companies().save(c);
        return companyView(c, await industriesFor([], [c]));
    }

    @Delete('/:companyId')
    @UseBefore(...EMPLOYER)
    async remove(@Req() req: RequestWithUser, @Param('companyId') companyId: string, @Res() res: Response) {
        const c = await loadOwnedCompany(companyId, req.user!.id);
        if (await dataSource.getRepository(Vacancy).existsBy({ companyId: c.id })) throw fail('COMPANY_HAS_VACANCIES');
        await this.companies().delete(c.id);
        return noContent(res);
    }

    @Get('/:companyId/vacancies')
    @UseBefore(...EMPLOYER)
    async vacancies(@Req() req: RequestWithUser, @Param('companyId') companyId: string, @QueryParams({ type: CompanyVacanciesQuery }) query: CompanyVacanciesQuery) {
        const c = await loadOwnedCompany(companyId, req.user!.id);
        const [list, total] = await dataSource.getRepository(Vacancy).findAndCount({
            where: { companyId: c.id, ...(query.is_active !== undefined ? { isActive: query.is_active } : {}) },
            relations: { company: true }, order: { createdAt: 'DESC' }, ...pageOptions(query),
        });
        const ind = await industriesFor(list);
        return paginate(list.map((v) => vacancyShortView(v, ind)), query.page, query.size, total);
    }
}
export default CompanyController;
