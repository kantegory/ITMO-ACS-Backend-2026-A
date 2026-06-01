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

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import {
    ensureConflict,
    ensureForbidden,
    ensureFound,
} from '../common/http-errors';
import { Application } from '../models/application.entity';
import { Vacancy } from '../models/vacancy.entity';
import { Resume } from '../models/resume.entity';
import { EmployerProfile } from '../models/employer-profile.entity';
import { UserRole } from '../models/enums/user-role.enum';
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
    private vacancyRepository = dataSource.getRepository(Vacancy);
    private resumeRepository = dataSource.getRepository(Resume);
    private employerProfileRepository =
        dataSource.getRepository(EmployerProfile);

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

        const vacancy = ensureFound(
            await this.vacancyRepository.findOneBy({ id: vacancyId }),
            'Vacancy not found',
        ) as Vacancy;

        ensureForbidden(vacancy.isPublished, 'Vacancy is not published');

        const resume = ensureFound(
            await this.resumeRepository.findOneBy({ id: payload.resume_id }),
            'Resume not found',
        ) as Resume;

        ensureForbidden(
            request.user.role === UserRole.ADMIN ||
                resume.userId === request.user.id,
            'Resume is not owned by current user',
        );

        const existingApplication = await this.repository.findOneBy({
            vacancyId,
            resumeId: payload.resume_id,
        });

        ensureConflict(
            !existingApplication,
            'Application for this vacancy and resume already exists',
        );

        return await this.repository.save(
            this.repository.create({
                vacancyId,
                resumeId: payload.resume_id,
                userId: resume.userId,
                coverLetter: payload.cover_letter ?? null,
            }),
        );
    }

    @Get('/vacancies/:vacancy_id/applications')
    @UseBefore(authMiddleware)
    async listByVacancy(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
        @QueryParams({ type: VacancyApplicationsQueryDto })
        query: VacancyApplicationsQueryDto,
    ) {
        const vacancy = ensureFound(
            await this.vacancyRepository.findOneBy({ id: vacancyId }),
            'Vacancy not found',
        ) as Vacancy;

        if (request.user.role !== UserRole.ADMIN) {
            const ownedProfile = await this.employerProfileRepository.findOneBy(
                {
                    id: vacancy.employerProfileId,
                    userId: request.user.id,
                },
            );

            ensureForbidden(
                !!ownedProfile && request.user.role === UserRole.EMPLOYER,
                'Only owner employer can view vacancy applications',
            );
        }

        const { page, limit, skip } = resolvePagination(query);
        const [items, total] = await this.repository.findAndCount({
            where: { vacancyId },
            relations: ['resume', 'user'],
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
            relations: ['vacancy', 'resume'],
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

        if (request.user.role !== UserRole.ADMIN) {
            const vacancy = ensureFound(
                await this.vacancyRepository.findOneBy({
                    id: application.vacancyId,
                }),
                'Vacancy not found',
            ) as Vacancy;

            const ownedProfile = await this.employerProfileRepository.findOneBy(
                {
                    id: vacancy.employerProfileId,
                    userId: request.user.id,
                },
            );

            ensureForbidden(
                !!ownedProfile && request.user.role === UserRole.EMPLOYER,
                'Only owner employer can update application status',
            );
        }

        application.status = payload.status;
        return await this.repository.save(application);
    }
}

export default ApplicationController;
