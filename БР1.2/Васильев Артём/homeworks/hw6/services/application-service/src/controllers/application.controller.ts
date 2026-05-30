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
import { randomUUID } from 'crypto';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import SETTINGS from '../config/settings';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import {
    ensureConflict,
    ensureForbidden,
    ensureFound,
} from '../common/http-errors';
import { serviceBatchGet } from '../common/service-client';
import { Application } from '../models/application.entity';
import { ApplicationStatus } from '../models/enums/application-status.enum';
import { UserRole } from '../models/enums/user-role.enum';
import { rabbitMqPublisher } from '../common/rabbitmq';
import {
    CreateApplicationDto,
    UpdateApplicationStatusDto,
    VacancyApplicationsQueryDto,
} from '../dto/application.dto';

@EntityController({
    baseRoute: '',
    entity: Application,
})
class ApplicationController extends BaseController {
    private async assertVacancyPublished(vacancyId: string) {
        const vacancies = await serviceBatchGet<{
            id: string;
            isPublished: boolean;
        }>(
            SETTINGS.VACANCY_SERVICE_URL,
            '/internal/v1/vacancies/batch',
            [vacancyId],
        );
        const vacancy = ensureFound(
            vacancies.items.find((item) => item.id === vacancyId),
            'Vacancy not found',
        );

        ensureForbidden(vacancy.isPublished, 'Vacancy is not published');
    }

    private async assertResumeOwnership(resumeId: string, userId: string) {
        const resumes = await serviceBatchGet<{
            id: string;
            userId: string;
        }>(
            SETTINGS.RESUME_SERVICE_URL,
            '/internal/v1/resumes/batch',
            [resumeId],
        );
        const resume = ensureFound(
            resumes.items.find((item) => item.id === resumeId),
            'Resume not found',
        );

        ensureForbidden(
            resume.userId === userId,
            'Resume is not owned by current user',
        );
    }

    private async assertVacancyOwnership(vacancyId: string, userId: string) {
        const vacancies = await serviceBatchGet<{
            id: string;
            companyId: string;
            employerProfileId: string;
        }>(
            SETTINGS.VACANCY_SERVICE_URL,
            '/internal/v1/vacancies/batch',
            [vacancyId],
        );
        const vacancy = ensureFound(
            vacancies.items.find((item) => item.id === vacancyId),
            'Vacancy not found',
        );

        const profiles = await serviceBatchGet<{
            id: string;
            userId: string;
            companyId: string;
        }>(
            SETTINGS.COMPANY_SERVICE_URL,
            '/internal/v1/employer-profiles/batch',
            [vacancy.employerProfileId],
        );
        const profile = ensureFound(
            profiles.items.find((item) => item.id === vacancy.employerProfileId),
            'Employer profile not found',
        );

        ensureForbidden(
            profile.userId === userId && profile.companyId === vacancy.companyId,
            'Only owner employer can manage vacancy applications',
        );
    }

    @Post('/vacancies/:vacancy_id/applications')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
        @Body({ type: CreateApplicationDto }) payload: CreateApplicationDto,
    ) {
        ensureForbidden(
            request.user.role === UserRole.APPLICANT ||
                request.user.role === UserRole.ADMIN,
            'Only applicant or admin can create application',
        );
        await this.assertVacancyPublished(vacancyId);
        await this.assertResumeOwnership(payload.resume_id, request.user.id);

        const existingApplication = await this.repository.findOneBy({
            vacancyId,
            resumeId: payload.resume_id,
        });

        ensureConflict(
            !existingApplication,
            'Application for this vacancy and resume already exists',
        );

        const application = (await this.repository.save(
            this.repository.create({
                vacancyId,
                resumeId: payload.resume_id,
                userId: request.user.id,
                coverLetter: payload.cover_letter ?? null,
            }),
        )) as Application;

        await rabbitMqPublisher.publishApplicationCreated({
            eventId: randomUUID(),
            eventType: 'application.created',
            occurredAt: new Date().toISOString(),
            payload: {
                applicationId: application.id,
                vacancyId: application.vacancyId,
                applicantId: application.userId,
                resumeId: application.resumeId,
                status: application.status || ApplicationStatus.PENDING,
            },
        });

        return application;
    }

    @Get('/vacancies/:vacancy_id/applications')
    @UseBefore(authMiddleware)
    async listByVacancy(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
        @QueryParams({ type: VacancyApplicationsQueryDto })
        query: VacancyApplicationsQueryDto,
    ) {
        ensureForbidden(
            [UserRole.EMPLOYER, UserRole.ADMIN].includes(request.user.role),
            'Only employer or admin can view vacancy applications',
        );
        if (request.user.role !== UserRole.ADMIN) {
            await this.assertVacancyOwnership(vacancyId, request.user.id);
        }

        const { page, limit, skip } = resolvePagination(query);
        const [items, total] = await this.repository.findAndCount({
            where: { vacancyId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip,
        });

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Get('/applications/my')
    @UseBefore(authMiddleware)
    async listMy(
        @Req() request: RequestWithUser,
        @QueryParams({ type: VacancyApplicationsQueryDto })
        query: VacancyApplicationsQueryDto,
    ) {
        const { page, limit, skip } = resolvePagination(query);
        const where =
            request.user.role === UserRole.ADMIN
                ? {}
                : { userId: request.user.id };

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

    @Patch('/applications/:application_id/status')
    @UseBefore(authMiddleware)
    async updateStatus(
        @Param('application_id') applicationId: string,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateApplicationStatusDto })
        payload: UpdateApplicationStatusDto,
    ) {
        const application = ensureFound(
            await this.repository.findOneBy({ id: applicationId }),
            'Application not found',
        ) as Application;

        ensureForbidden(
            [UserRole.EMPLOYER, UserRole.ADMIN].includes(request.user.role),
            'Only employer or admin can update application status',
        );
        if (request.user.role !== UserRole.ADMIN) {
            await this.assertVacancyOwnership(
                application.vacancyId,
                request.user.id,
            );
        }

        application.status = payload.status;
        return await this.repository.save(application);
    }
}

export default ApplicationController;
