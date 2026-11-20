import {
    Body,
    Get,
    Patch,
    Post,
    Param,
    UseBefore,
    Req,
    HttpError,
} from 'routing-controllers';

import { IsString, IsIn, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import AuthOpenAPI from '../common/auth-openapi';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Application } from '../models/application.entity';

import authMiddleware from '../middlewares/auth.middleware';
import { assertExists, requestService } from '../common/service-client';

class UpdateApplicationStatusCheck {
    @IsString()
    @IsIn(['sent', 'viewed', 'invited', 'rejected'])
    @Type(() => String)
    status: string;
}

class CreateInternalApplicationCheck {
    @IsInt()
    @Type(() => Number)
    resume_id: number;

    @IsInt()
    @Type(() => Number)
    vacancy_id: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    cover_letter: string;
}

@EntityController({
    baseRoute: '/applications',
    entity: Application,
})
class ApplicationController extends BaseController {
    @Post('/internal')
    async createInternal(
        @Body({ type: CreateInternalApplicationCheck })
        body: CreateInternalApplicationCheck,
    ) {
        await assertExists(
            'resume',
            `/resumes/internal/${body.resume_id}`,
            'Resume not found',
        );
        await assertExists(
            'vacancy',
            `/vacancies/internal/${body.vacancy_id}`,
            'Vacancy not found',
        );

        const existingApplication = await this.repository.findOneBy({
            resume_id: body.resume_id,
            vacancy_id: body.vacancy_id,
        });

        if (existingApplication) {
            throw new HttpError(409, 'Application already exists');
        }

        const application = this.repository.create({
            resume_id: body.resume_id,
            vacancy_id: body.vacancy_id,
            cover_letter: body.cover_letter,
            status: 'sent',
        });

        return await this.repository.save(application);
    }

    @Get('/internal/by-vacancy/:vacancyId')
    async getInternalByVacancy(@Param('vacancyId') vacancyId: number) {
        return await this.repository.findBy({ vacancy_id: vacancyId });
    }

    @Get('/me')
    @AuthOpenAPI('Получить свои отклики', ['applications'])
    @UseBefore(authMiddleware)
    async getMyApplications(@Req() request: any) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can view own applications');
        }

        const applications = await this.repository.find();
        const result = [];

        for (const application of applications) {
            const ownership = await requestService<{ owns: boolean }>(
                'resume',
                `/resumes/internal/${application.resume_id}/ownership?user_id=${currentUserId}`,
            );

            if (ownership.owns) {
                result.push(application);
            }
        }

        return result;
    }

    @Patch('/:id/status')
    @AuthOpenAPI('Изменить статус отклика', ['applications'])
    @UseBefore(authMiddleware)
    async updateStatus(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: UpdateApplicationStatusCheck })
        body: UpdateApplicationStatusCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(
                403,
                'Only company can update application status',
            );
        }

        const application = await this.repository.findOne({
            where: {
                application_id: id,
            },
        });

        if (!application) {
            throw new HttpError(404, 'Application not found');
        }

        const ownership = await requestService<{ owns: boolean }>(
            'vacancy',
            `/vacancies/internal/${application.vacancy_id}/ownership?user_id=${currentUserId}`,
        );

        if (!ownership.owns) {
            throw new HttpError(
                403,
                'You can update only applications for your own vacancies',
            );
        }

        application.status = body.status;
        return await this.repository.save(application);
    }
}

export default ApplicationController;
