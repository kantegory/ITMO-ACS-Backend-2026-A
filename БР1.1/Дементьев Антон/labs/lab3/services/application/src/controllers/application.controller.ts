import { IsIn, IsOptional } from 'class-validator';
import { Body, Delete, Get, JsonController, Param, Patch, Post, QueryParams, Req, Res, UseBefore } from 'routing-controllers';
import { Response } from 'express';
import { ApplicationStatus, created, fail, getResume, getVacancy, invalid, isUniqueViolation, noContent, PageQuery, pageOptions, paginate, Role, ApiError, uuidParam } from '@jobsearch/common';

import { dataSource } from '../db';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/application.dto';
import { authMiddleware, requireRole, RequestWithUser } from '../auth';
import { Application } from '../models/application.entity';
import { applicationView, buildDetail, buildList } from '../compose';

class ApplicationsQuery extends PageQuery {
    @IsOptional() @IsIn(Object.values(ApplicationStatus)) status?: ApplicationStatus;
}
const JOBSEEKER = [authMiddleware, requireRole(Role.JOBSEEKER)];
const EMPLOYER = [authMiddleware, requireRole(Role.EMPLOYER)];
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.PENDING]: [ApplicationStatus.VIEWED, ApplicationStatus.INVITED, ApplicationStatus.REJECTED],
    [ApplicationStatus.VIEWED]: [ApplicationStatus.INVITED, ApplicationStatus.REJECTED],
    [ApplicationStatus.INVITED]: [], [ApplicationStatus.REJECTED]: [],
};

@JsonController('/api/v1')
class ApplicationController {
    private apps = () => dataSource.getRepository(Application);
    private load = async (id: string) => {
        const a = await this.apps().findOneBy({ id: uuidParam(id, 'APPLICATION_NOT_FOUND') });
        if (!a) throw fail('APPLICATION_NOT_FOUND');
        return a;
    };

    @Post('/vacancies/:vacancyId/applications')
    @UseBefore(...JOBSEEKER)
    async apply(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @Body({ type: CreateApplicationDto }) body: CreateApplicationDto, @Res() res: Response) {
        const vacancy = await getVacancy(uuidParam(vacancyId, 'VACANCY_NOT_FOUND'));
        let resume: any;
        try { resume = await getResume(body.resume_id); }
        catch (e) { if (e instanceof ApiError && e.code === 'RESUME_NOT_FOUND') throw invalid('resume_id', 'Резюме не найдено'); throw e; }
        if (resume.user_id !== req.user!.id) throw fail('FORBIDDEN');
        if (!vacancy.is_active) throw fail('VACANCY_NOT_ACTIVE');
        if (!resume.is_published) throw fail('RESUME_NOT_PUBLISHED');
        if (await this.apps().existsBy({ vacancyId: vacancy.id, resumeId: resume.id })) throw fail('APPLICATION_ALREADY_EXISTS');
        try {
            const saved = await this.apps().save(this.apps().create({
                vacancyId: vacancy.id, resumeId: resume.id, applicantUserId: resume.user_id, employerUserId: vacancy.company.owner_user_id,
                coverLetter: body.cover_letter ?? null, status: ApplicationStatus.PENDING,
            }));
            return created(res, `/applications/${saved.id}`, applicationView(saved));
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('APPLICATION_ALREADY_EXISTS');
            throw error;
        }
    }

    @Get('/vacancies/:vacancyId/applications')
    @UseBefore(...EMPLOYER)
    async listForVacancy(@Req() req: RequestWithUser, @Param('vacancyId') vacancyId: string, @QueryParams({ type: ApplicationsQuery }) query: ApplicationsQuery) {
        const vacancy = await getVacancy(uuidParam(vacancyId, 'VACANCY_NOT_FOUND'));
        if (vacancy.company.owner_user_id !== req.user!.id) throw fail('FORBIDDEN');
        const [list, total] = await this.apps().findAndCount({
            where: { vacancyId: vacancy.id, ...(query.status ? { status: query.status } : {}) }, order: { createdAt: 'DESC' }, ...pageOptions(query),
        });
        return paginate(await buildList(list), query.page, query.size, total);
    }

    @Get('/applications')
    @UseBefore(...JOBSEEKER)
    async listMine(@Req() req: RequestWithUser, @QueryParams({ type: ApplicationsQuery }) query: ApplicationsQuery) {
        const [list, total] = await this.apps().findAndCount({
            where: { applicantUserId: req.user!.id, ...(query.status ? { status: query.status } : {}) }, order: { createdAt: 'DESC' }, ...pageOptions(query),
        });
        return paginate(await buildList(list), query.page, query.size, total);
    }

    @Get('/applications/:applicationId')
    @UseBefore(authMiddleware)
    async get(@Req() req: RequestWithUser, @Param('applicationId') applicationId: string) {
        let a = await this.load(applicationId);
        const isAuthor = a.applicantUserId === req.user!.id, isOwner = a.employerUserId === req.user!.id;
        if (!isAuthor && !isOwner) throw fail('FORBIDDEN');
        if (isOwner && a.status === ApplicationStatus.PENDING) {
            await this.apps().update(a.id, { status: ApplicationStatus.VIEWED });
            a = await this.load(a.id);
        }
        return buildDetail(a);
    }

    @Patch('/applications/:applicationId/status')
    @UseBefore(...EMPLOYER)
    async updateStatus(@Req() req: RequestWithUser, @Param('applicationId') applicationId: string, @Body({ type: UpdateApplicationStatusDto }) body: UpdateApplicationStatusDto) {
        const a = await this.load(applicationId);
        if (a.employerUserId !== req.user!.id) throw fail('FORBIDDEN');
        if (!TRANSITIONS[a.status].includes(body.status)) throw fail('INVALID_STATUS_TRANSITION');
        await this.apps().update(a.id, { status: body.status });
        return applicationView(await this.load(a.id));
    }

    @Delete('/applications/:applicationId')
    @UseBefore(...JOBSEEKER)
    async withdraw(@Req() req: RequestWithUser, @Param('applicationId') applicationId: string, @Res() res: Response) {
        const a = await this.load(applicationId);
        if (a.applicantUserId !== req.user!.id) throw fail('FORBIDDEN');
        if (a.status !== ApplicationStatus.PENDING && a.status !== ApplicationStatus.VIEWED) throw fail('APPLICATION_NOT_WITHDRAWABLE');
        await this.apps().delete(a.id);
        return noContent(res);
    }
}
export default ApplicationController;
