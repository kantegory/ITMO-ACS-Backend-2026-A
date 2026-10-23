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
import { fail, invalid } from '../common/errors';
import { created, noContent } from '../common/http';
import { pageOptions, paginate } from '../common/pagination';
import { isUniqueViolation, uuidParam } from '../common/validators';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/application.dto';
import { ApplicationsQuery } from '../dto/vacancy.dto';
import authMiddleware, { requireRole, RequestWithUser } from '../middlewares/auth.middleware';
import { Application } from '../models/application.entity';
import { ApplicationStatus, Role } from '../models/enums';
import { Resume } from '../models/resume.entity';
import { Vacancy } from '../models/vacancy.entity';
import { loadOwnedVacancy } from '../services/access.service';
import {
    APPLICATION_RELATIONS,
    applicationView,
    buildApplicationDetail,
    buildApplicationList,
} from '../views/application.view';

const AUTH = { security: [{ bearerAuth: [] }] };
const JOBSEEKER = [authMiddleware, requireRole(Role.JOBSEEKER)];
const EMPLOYER = [authMiddleware, requireRole(Role.EMPLOYER)];

// Разрешённые переходы статуса отклика
const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.PENDING]: [
        ApplicationStatus.VIEWED,
        ApplicationStatus.INVITED,
        ApplicationStatus.REJECTED,
    ],
    [ApplicationStatus.VIEWED]: [ApplicationStatus.INVITED, ApplicationStatus.REJECTED],
    [ApplicationStatus.INVITED]: [],
    [ApplicationStatus.REJECTED]: [],
};

@JsonController()
class ApplicationController {
    private apps = () => dataSource.getRepository(Application);

    private loadApplication = async (id: string) => {
        const app = await this.apps().findOne({
            where: { id: uuidParam(id, 'APPLICATION_NOT_FOUND') },
            relations: APPLICATION_RELATIONS,
        });
        if (!app) throw fail('APPLICATION_NOT_FOUND');
        return app;
    };

    // Соискатель откликается на вакансию
    @Post('/vacancies/:vacancyId/applications')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Отклик на вакансию', ...AUTH })
    async apply(
        @Req() req: RequestWithUser,
        @Param('vacancyId') vacancyId: string,
        @Body({ type: CreateApplicationDto }) body: CreateApplicationDto,
        @Res() res: Response,
    ) {
        const vacancy = await dataSource
            .getRepository(Vacancy)
            .findOneBy({ id: uuidParam(vacancyId, 'VACANCY_NOT_FOUND') });
        if (!vacancy) throw fail('VACANCY_NOT_FOUND');

        const resume = await dataSource.getRepository(Resume).findOneBy({ id: body.resume_id });
        if (!resume) throw invalid('resume_id', 'Резюме не найдено');
        if (resume.userId !== req.user!.id) throw fail('FORBIDDEN');

        if (!vacancy.isActive) throw fail('VACANCY_NOT_ACTIVE');
        if (!resume.isPublished) throw fail('RESUME_NOT_PUBLISHED');
        if (await this.apps().existsBy({ vacancyId: vacancy.id, resumeId: resume.id })) {
            throw fail('APPLICATION_ALREADY_EXISTS');
        }

        try {
            const saved = await this.apps().save(
                this.apps().create({
                    vacancyId: vacancy.id,
                    resumeId: resume.id,
                    coverLetter: body.cover_letter ?? null,
                    status: ApplicationStatus.PENDING,
                }),
            );
            return created(res, `/applications/${saved.id}`, applicationView(saved));
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('APPLICATION_ALREADY_EXISTS');
            throw error;
        }
    }

    // Работодатель смотрит отклики на свою вакансию
    @Get('/vacancies/:vacancyId/applications')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Отклики на вакансию', ...AUTH })
    async listForVacancy(
        @Req() req: RequestWithUser,
        @Param('vacancyId') vacancyId: string,
        @QueryParams({ type: ApplicationsQuery }) query: ApplicationsQuery,
    ) {
        const vacancy = await loadOwnedVacancy(vacancyId, req.user!.id);
        const [list, total] = await this.apps().findAndCount({
            where: { vacancyId: vacancy.id, ...(query.status ? { status: query.status } : {}) },
            relations: APPLICATION_RELATIONS,
            order: { createdAt: 'DESC' },
            ...pageOptions(query),
        });
        return paginate(await buildApplicationList(list), query.page, query.size, total);
    }

    // Соискатель смотрит свои отклики
    @Get('/applications')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Мои отклики', ...AUTH })
    async listMine(@Req() req: RequestWithUser, @QueryParams({ type: ApplicationsQuery }) query: ApplicationsQuery) {
        const [list, total] = await this.apps().findAndCount({
            where: {
                resume: { userId: req.user!.id },
                ...(query.status ? { status: query.status } : {}),
            },
            relations: APPLICATION_RELATIONS,
            order: { createdAt: 'DESC' },
            ...pageOptions(query),
        });
        return paginate(await buildApplicationList(list), query.page, query.size, total);
    }

    @Get('/applications/:applicationId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Просмотр отклика', ...AUTH })
    async get(@Req() req: RequestWithUser, @Param('applicationId') applicationId: string) {
        let app = await this.loadApplication(applicationId);
        const userId = req.user!.id;

        const isAuthor = app.resume.userId === userId;
        const isVacancyOwner = app.vacancy.company.ownerUserId === userId;
        if (!isAuthor && !isVacancyOwner) throw fail('FORBIDDEN');

        // когда работодатель впервые открывает отклик, он становится «просмотренным»
        if (isVacancyOwner && app.status === ApplicationStatus.PENDING) {
            await this.apps().update(app.id, { status: ApplicationStatus.VIEWED });
            app = await this.loadApplication(app.id);
        }
        return buildApplicationDetail(app);
    }

    @Patch('/applications/:applicationId/status')
    @UseBefore(...EMPLOYER)
    @OpenAPI({ summary: 'Изменение статуса отклика', ...AUTH })
    async updateStatus(
        @Req() req: RequestWithUser,
        @Param('applicationId') applicationId: string,
        @Body({ type: UpdateApplicationStatusDto }) body: UpdateApplicationStatusDto,
    ) {
        const app = await this.loadApplication(applicationId);
        if (app.vacancy.company.ownerUserId !== req.user!.id) throw fail('FORBIDDEN');
        if (!TRANSITIONS[app.status].includes(body.status)) {
            throw fail('INVALID_STATUS_TRANSITION');
        }

        await this.apps().update(app.id, { status: body.status });
        return applicationView(await this.loadApplication(app.id));
    }

    @Delete('/applications/:applicationId')
    @UseBefore(...JOBSEEKER)
    @OpenAPI({ summary: 'Отзыв отклика', ...AUTH })
    async withdraw(
        @Req() req: RequestWithUser,
        @Param('applicationId') applicationId: string,
        @Res() res: Response,
    ) {
        const app = await this.loadApplication(applicationId);
        if (app.resume.userId !== req.user!.id) throw fail('FORBIDDEN');
        if (app.status !== ApplicationStatus.PENDING && app.status !== ApplicationStatus.VIEWED) {
            throw fail('APPLICATION_NOT_WITHDRAWABLE');
        }
        await this.apps().delete(app.id);
        return noContent(res);
    }
}

export default ApplicationController;
