import {
    Body,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    QueryParam,
    UseBefore,
    Req,
    HttpError,
} from 'routing-controllers';

import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

import AuthOpenAPI, { PublicOpenAPI } from '../common/auth-openapi';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Vacancy } from '../models/vacancy.entity';

import authMiddleware from '../middlewares/auth.middleware';
import { assertExists, requestService } from '../common/service-client';

class CreateVacancyCheck {
    @IsInt()
    @Type(() => Number)
    specialization_id: number;

    @IsString()
    @Type(() => String)
    title: string;

    @IsString()
    @Type(() => String)
    description: string;

    @IsString()
    @Type(() => String)
    requirements: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    salary_min: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    salary_max: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    experience_required: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    location: string;

    @IsOptional()
    @IsString()
    @IsIn(['office', 'remote', 'hybrid'])
    @Type(() => String)
    work_format: string;

    @IsOptional()
    @IsString()
    @IsIn(['full-time', 'part-time', 'internship', 'contract'])
    @Type(() => String)
    employment_type: string;
}

class UpdateVacancyCheck extends CreateVacancyCheck {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    specialization_id: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    title: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    requirements: string;

    @IsOptional()
    @IsString()
    @IsIn(['active', 'archived', 'closed'])
    @Type(() => String)
    status: string;
}

class CreateVacancyApplicationCheck {
    @IsInt()
    @Type(() => Number)
    resume_id: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    cover_letter: string;
}

function getUpdatedAtOrder(updated_at_order?: string): 'ASC' | 'DESC' {
    return String(updated_at_order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
}

@EntityController({
    baseRoute: '/vacancies',
    entity: Vacancy,
})
class VacancyController extends BaseController {
    @Get('/internal/:id')
    async getInternalById(@Param('id') id: number) {
        const vacancy = await this.repository.findOneBy({ vacancy_id: id });

        if (!vacancy) {
            throw new HttpError(404, 'Vacancy not found');
        }

        return vacancy;
    }

    @Get('/internal/:id/ownership')
    async getInternalOwnership(
        @Param('id') id: number,
        @QueryParam('user_id') user_id: number,
    ) {
        const vacancy = await this.repository.findOneBy({ vacancy_id: id });

        if (!vacancy) {
            throw new HttpError(404, 'Vacancy not found');
        }

        const company = await requestService<{ company_id: number }>(
            'profile',
            `/companies/internal/by-user/${user_id}`,
        );

        return {
            owns: vacancy.company_id === company.company_id,
            vacancy,
        };
    }

    @Get('/internal/by-company/:companyId')
    async getInternalByCompany(
        @Param('companyId') companyId: number,
        @QueryParam('updated_at_order') updated_at_order?: string,
    ) {
        return await this.repository.find({
            where: {
                company_id: companyId,
            },
            order: {
                updated_at: getUpdatedAtOrder(updated_at_order),
            },
        });
    }

    @Get('/')
    @PublicOpenAPI('Поиск вакансий', ['vacancies'])
    async getAll(
        @QueryParam('specialization_id') specialization_id?: number,
        @QueryParam('salary_min') salary_min?: number,
        @QueryParam('salary_max') salary_max?: number,
        @QueryParam('experience_required') experience_required?: number,
        @QueryParam('location') location?: string,
        @QueryParam('work_format') work_format?: string,
        @QueryParam('employment_type') employment_type?: string,
        @QueryParam('updated_at_order') updated_at_order?: string,
    ) {
        const order = getUpdatedAtOrder(updated_at_order);
        const vacancies = await this.repository.find({});

        const filteredVacancies = vacancies.filter((vacancy: Vacancy) => {
            if (
                specialization_id !== undefined &&
                vacancy.specialization_id !== Number(specialization_id)
            ) {
                return false;
            }
            if (
                salary_min !== undefined &&
                (vacancy.salary_min ?? 0) < Number(salary_min)
            ) {
                return false;
            }
            if (
                salary_max !== undefined &&
                (vacancy.salary_max ?? 0) > Number(salary_max)
            ) {
                return false;
            }
            if (
                experience_required !== undefined &&
                (vacancy.experience_required ?? 0) !==
                    Number(experience_required)
            ) {
                return false;
            }
            if (location !== undefined && vacancy.location !== location) {
                return false;
            }
            if (
                work_format !== undefined &&
                vacancy.work_format !== work_format
            ) {
                return false;
            }
            if (
                employment_type !== undefined &&
                vacancy.employment_type !== employment_type
            ) {
                return false;
            }
            return true;
        });

        return filteredVacancies.sort(
            (firstVacancy: Vacancy, secondVacancy: Vacancy) => {
                const firstUpdatedAt = new Date(
                    firstVacancy.updated_at,
                ).getTime();
                const secondUpdatedAt = new Date(
                    secondVacancy.updated_at,
                ).getTime();

                if (order === 'ASC') {
                    return firstUpdatedAt - secondUpdatedAt;
                }

                return secondUpdatedAt - firstUpdatedAt;
            },
        );
    }

    @Post('/')
    @AuthOpenAPI('Создать вакансию', ['vacancies'])
    @UseBefore(authMiddleware)
    async create(
        @Req() request: any,
        @Body({ type: CreateVacancyCheck }) body: CreateVacancyCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can create vacancy');
        }

        const company = await requestService<{ company_id: number }>(
            'profile',
            `/companies/internal/by-user/${currentUserId}`,
        );
        await assertExists(
            'reference',
            `/specializations/internal/${body.specialization_id}`,
            'Specialization not found',
        );

        const vacancy = this.repository.create({
            company_id: company.company_id,
            specialization_id: body.specialization_id,
            title: body.title,
            description: body.description,
            requirements: body.requirements,
            salary_min: body.salary_min,
            salary_max: body.salary_max,
            experience_required: body.experience_required,
            location: body.location,
            work_format: body.work_format,
            employment_type: body.employment_type,
            status: 'active',
        });

        return await this.repository.save(vacancy);
    }

    @Get('/me')
    @AuthOpenAPI('Получить свои вакансии', ['vacancies'])
    @UseBefore(authMiddleware)
    async getMyVacancies(
        @Req() request: any,
        @QueryParam('updated_at_order') updated_at_order?: string,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can view own vacancies');
        }

        const company = await requestService<{ company_id: number }>(
            'profile',
            `/companies/internal/by-user/${currentUserId}`,
        );

        return await this.repository.find({
            where: {
                company_id: company.company_id,
            },
            order: {
                updated_at: getUpdatedAtOrder(updated_at_order),
            },
        });
    }

    @Get('/:id')
    @PublicOpenAPI('Получить вакансию', ['vacancies'])
    async getById(@Param('id') id: number) {
        const vacancy = await this.repository.findOne({
            where: {
                vacancy_id: id,
            },
        });

        if (!vacancy) {
            throw new HttpError(404, 'Vacancy not found');
        }

        return vacancy;
    }

    @Post('/:id/applications')
    @AuthOpenAPI('Откликнуться на вакансию', ['applications'])
    @UseBefore(authMiddleware)
    async createApplication(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: CreateVacancyApplicationCheck })
        body: CreateVacancyApplicationCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can create application');
        }

        const resumeOwnership = await requestService<{ owns: boolean }>(
            'resume',
            `/resumes/internal/${body.resume_id}/ownership?user_id=${currentUserId}`,
        );

        if (!resumeOwnership.owns) {
            throw new HttpError(403, 'You can use only your own resume');
        }

        const vacancy = await this.repository.findOneBy({
            vacancy_id: id,
        });

        if (!vacancy) {
            throw new HttpError(404, 'Vacancy not found');
        }

        return await requestService('application', '/applications/internal', {
            method: 'POST',
            body: JSON.stringify({
                resume_id: body.resume_id,
                vacancy_id: vacancy.vacancy_id,
                cover_letter: body.cover_letter,
            }),
        });
    }

    @Get('/:id/applications')
    @AuthOpenAPI('Получить отклики на вакансию', ['applications'])
    @UseBefore(authMiddleware)
    async getApplications(@Req() request: any, @Param('id') id: number) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(
                403,
                'Only company can view vacancy applications',
            );
        }

        const vacancy = await this.repository.findOne({
            where: {
                vacancy_id: id,
            },
        });

        if (!vacancy) {
            throw new HttpError(404, 'Vacancy not found');
        }

        const ownership = await requestService<{ owns: boolean }>(
            'vacancy',
            `/vacancies/internal/${id}/ownership?user_id=${currentUserId}`,
        );

        if (!ownership.owns) {
            throw new HttpError(
                403,
                'You can view applications only for your own vacancy',
            );
        }

        return await requestService(
            'application',
            `/applications/internal/by-vacancy/${id}`,
        );
    }

    @Patch('/:id')
    @AuthOpenAPI('Обновить вакансию', ['vacancies'])
    @UseBefore(authMiddleware)
    async update(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: UpdateVacancyCheck }) body: UpdateVacancyCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can update vacancy');
        }

        const vacancy = await this.repository.findOne({
            where: {
                vacancy_id: id,
            },
        });

        if (!vacancy) {
            throw new HttpError(404, 'Vacancy not found');
        }

        const ownership = await requestService<{ owns: boolean }>(
            'vacancy',
            `/vacancies/internal/${id}/ownership?user_id=${currentUserId}`,
        );

        if (!ownership.owns) {
            throw new HttpError(403, 'You can update only your own vacancy');
        }

        if (body.title !== undefined) vacancy.title = body.title;
        if (body.description !== undefined)
            vacancy.description = body.description;
        if (body.requirements !== undefined)
            vacancy.requirements = body.requirements;
        if (body.salary_min !== undefined) vacancy.salary_min = body.salary_min;
        if (body.salary_max !== undefined) vacancy.salary_max = body.salary_max;
        if (body.experience_required !== undefined)
            vacancy.experience_required = body.experience_required;
        if (body.location !== undefined) vacancy.location = body.location;
        if (body.work_format !== undefined)
            vacancy.work_format = body.work_format;
        if (body.employment_type !== undefined)
            vacancy.employment_type = body.employment_type;
        if (body.status !== undefined) vacancy.status = body.status;

        if (body.specialization_id !== undefined) {
            await assertExists(
                'reference',
                `/specializations/internal/${body.specialization_id}`,
                'Specialization not found',
            );
            vacancy.specialization_id = body.specialization_id;
        }

        return await this.repository.save(vacancy);
    }

    @Delete('/:id')
    @AuthOpenAPI('Удалить вакансию', ['vacancies'])
    @UseBefore(authMiddleware)
    async delete(@Req() request: any, @Param('id') id: number) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can delete vacancy');
        }

        const vacancy = await this.repository.findOne({
            where: {
                vacancy_id: id,
            },
        });

        if (!vacancy) {
            throw new HttpError(404, 'Vacancy not found');
        }

        const ownership = await requestService<{ owns: boolean }>(
            'vacancy',
            `/vacancies/internal/${id}/ownership?user_id=${currentUserId}`,
        );

        if (!ownership.owns) {
            throw new HttpError(403, 'You can delete only your own vacancy');
        }

        await this.repository.remove(vacancy);

        return {
            message: 'Vacancy deleted successfully',
        };
    }
}

export default VacancyController;
