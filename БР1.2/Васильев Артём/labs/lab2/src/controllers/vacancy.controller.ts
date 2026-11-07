import {
    Body,
    Delete,
    Get,
    HttpCode,
    OnUndefined,
    Param,
    Patch,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { Brackets } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    optionalAuthMiddleware,
    RequestWithOptionalUser,
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { resolvePagination, buildPageMeta } from '../common/pagination';
import {
    ensureBadRequest,
    ensureForbidden,
    ensureFound,
} from '../common/http-errors';
import { Vacancy } from '../models/vacancy.entity';
import { Company } from '../models/company.entity';
import { EmployerProfile } from '../models/employer-profile.entity';
import { Industry } from '../models/industry.entity';
import { ExperienceLevel } from '../models/experience-level.entity';
import { UserRole } from '../models/enums/user-role.enum';
import {
    CreateVacancyDto,
    UpdateVacancyDto,
    VacancyListQueryDto,
} from '../dto/vacancy.dto';

@EntityController({
    baseRoute: '/vacancies',
    entity: Vacancy,
})
class VacancyController extends BaseController {
    private companyRepository = dataSource.getRepository(Company);
    private employerProfileRepository =
        dataSource.getRepository(EmployerProfile);
    private industryRepository = dataSource.getRepository(Industry);
    private experienceLevelRepository =
        dataSource.getRepository(ExperienceLevel);

    private async assertEmployerOwnership(
        request: RequestWithUser,
        companyId: string,
        employerProfileId: string,
    ) {
        if (request.user.role === UserRole.ADMIN) {
            return;
        }

        ensureForbidden(
            request.user.role === UserRole.EMPLOYER,
            'Only employer or admin can manage vacancies',
        );

        const profile = await this.employerProfileRepository.findOneBy({
            id: employerProfileId,
            userId: request.user.id,
        });

        ensureForbidden(
            !!profile,
            'Employer profile is not owned by current user',
        );
        ensureBadRequest(
            profile?.companyId === companyId,
            'Employer profile and company mismatch',
        );
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateVacancyDto }) payload: CreateVacancyDto,
    ) {
        await this.assertEmployerOwnership(
            request,
            payload.company_id,
            payload.employer_profile_id,
        );

        ensureFound(
            await this.companyRepository.findOneBy({ id: payload.company_id }),
            'Company not found',
        );
        ensureFound(
            await this.employerProfileRepository.findOneBy({
                id: payload.employer_profile_id,
            }),
            'Employer profile not found',
        );
        ensureFound(
            await this.industryRepository.findOneBy({
                id: payload.industry_id,
            }),
            'Industry not found',
        );
        ensureFound(
            await this.experienceLevelRepository.findOneBy({
                id: payload.experience_level_id,
            }),
            'Experience level not found',
        );

        ensureBadRequest(
            payload.salary_to >= payload.salary_from,
            'salary_to must be greater than or equal to salary_from',
        );

        return await this.repository.save(
            this.repository.create({
                companyId: payload.company_id,
                employerProfileId: payload.employer_profile_id,
                industryId: payload.industry_id,
                experienceLevelId: payload.experience_level_id,
                title: payload.title,
                description: payload.description,
                requirements: payload.requirements,
                responsibilities: payload.responsibilities,
                salaryFrom: payload.salary_from,
                salaryTo: payload.salary_to,
                city: payload.city,
                employmentType: payload.employment_type,
                workFormat: payload.work_format,
                isPublished: payload.is_published,
            }),
        );
    }

    @Get('')
    async list(
        @QueryParams({ type: VacancyListQueryDto }) query: VacancyListQueryDto,
    ) {
        const { page, limit, skip } = resolvePagination(query);
        const qb = this.repository
            .createQueryBuilder('vacancy')
            .leftJoinAndSelect('vacancy.company', 'company')
            .leftJoinAndSelect('vacancy.industry', 'industry')
            .leftJoinAndSelect('vacancy.experienceLevel', 'experienceLevel')
            .where('vacancy.is_published = true')
            .orderBy('vacancy.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        if (query.city) {
            qb.andWhere('vacancy.city ILIKE :city', {
                city: `%${query.city}%`,
            });
        }

        if (query.industry_id) {
            qb.andWhere('vacancy.industry_id = :industryId', {
                industryId: query.industry_id,
            });
        }

        if (query.experience_level_id) {
            qb.andWhere('vacancy.experience_level_id = :experienceLevelId', {
                experienceLevelId: query.experience_level_id,
            });
        }

        if (query.employment_type) {
            qb.andWhere('vacancy.employment_type = :employmentType', {
                employmentType: query.employment_type,
            });
        }

        if (query.work_format) {
            qb.andWhere('vacancy.work_format = :workFormat', {
                workFormat: query.work_format,
            });
        }

        if (query.salary_from !== undefined) {
            qb.andWhere('vacancy.salary_from >= :salaryFrom', {
                salaryFrom: query.salary_from,
            });
        }

        if (query.salary_to !== undefined) {
            qb.andWhere('vacancy.salary_to <= :salaryTo', {
                salaryTo: query.salary_to,
            });
        }

        if (query.search) {
            qb.andWhere(
                new Brackets((searchQb) => {
                    searchQb
                        .where('vacancy.title ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('vacancy.description ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('vacancy.requirements ILIKE :search', {
                            search: `%${query.search}%`,
                        })
                        .orWhere('vacancy.responsibilities ILIKE :search', {
                            search: `%${query.search}%`,
                        });
                }),
            );
        }

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Get('/my')
    @UseBefore(authMiddleware)
    async listMy(
        @Req() request: RequestWithUser,
        @QueryParams({ type: VacancyListQueryDto }) query: VacancyListQueryDto,
    ) {
        const { page, limit, skip } = resolvePagination(query);
        const qb = this.repository
            .createQueryBuilder('vacancy')
            .leftJoinAndSelect('vacancy.company', 'company')
            .leftJoinAndSelect('vacancy.employerProfile', 'employerProfile')
            .orderBy('vacancy.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        if (request.user.role !== UserRole.ADMIN) {
            qb.where('employerProfile.user_id = :userId', {
                userId: request.user.id,
            });
        }

        const [items, total] = await qb.getManyAndCount();

        return {
            items,
            meta: buildPageMeta(page, limit, total),
        };
    }

    @Get('/:vacancy_id')
    @UseBefore(optionalAuthMiddleware)
    async getById(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithOptionalUser,
    ) {
        const vacancy = ensureFound(
            await this.repository.findOne({
                where: { id: vacancyId },
                relations: [
                    'company',
                    'industry',
                    'experienceLevel',
                    'employerProfile',
                ],
            }),
            'Vacancy not found',
        ) as Vacancy;

        if (!vacancy.isPublished) {
            if (!request.user) {
                ensureForbidden(false, 'Vacancy is not published');
            }

            if (request.user?.role !== UserRole.ADMIN) {
                const ownedProfile =
                    await this.employerProfileRepository.findOneBy({
                        id: vacancy.employerProfileId,
                        userId: request.user?.id,
                    });

                ensureForbidden(!!ownedProfile, 'Vacancy is not published');
            }
        }

        return vacancy;
    }

    @Patch('/:vacancy_id')
    @UseBefore(authMiddleware)
    async update(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateVacancyDto }) payload: UpdateVacancyDto,
    ) {
        const vacancy = ensureFound(
            await this.repository.findOneBy({ id: vacancyId }),
            'Vacancy not found',
        ) as Vacancy;

        await this.assertEmployerOwnership(
            request,
            payload.company_id ?? vacancy.companyId,
            payload.employer_profile_id ?? vacancy.employerProfileId,
        );

        if (
            payload.salary_from !== undefined ||
            payload.salary_to !== undefined
        ) {
            ensureBadRequest(
                (payload.salary_to ?? vacancy.salaryTo) >=
                    (payload.salary_from ?? vacancy.salaryFrom),
                'salary_to must be greater than or equal to salary_from',
            );
        }

        Object.assign(vacancy, {
            companyId: payload.company_id ?? vacancy.companyId,
            employerProfileId:
                payload.employer_profile_id ?? vacancy.employerProfileId,
            industryId: payload.industry_id ?? vacancy.industryId,
            experienceLevelId:
                payload.experience_level_id ?? vacancy.experienceLevelId,
            title: payload.title ?? vacancy.title,
            description: payload.description ?? vacancy.description,
            requirements: payload.requirements ?? vacancy.requirements,
            responsibilities:
                payload.responsibilities ?? vacancy.responsibilities,
            salaryFrom: payload.salary_from ?? vacancy.salaryFrom,
            salaryTo: payload.salary_to ?? vacancy.salaryTo,
            city: payload.city ?? vacancy.city,
            employmentType: payload.employment_type ?? vacancy.employmentType,
            workFormat: payload.work_format ?? vacancy.workFormat,
            isPublished: payload.is_published ?? vacancy.isPublished,
        });

        return await this.repository.save(vacancy);
    }

    @Delete('/:vacancy_id')
    @HttpCode(204)
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    async remove(
        @Param('vacancy_id') vacancyId: string,
        @Req() request: RequestWithUser,
    ) {
        const vacancy = ensureFound(
            await this.repository.findOneBy({ id: vacancyId }),
            'Vacancy not found',
        ) as Vacancy;

        await this.assertEmployerOwnership(
            request,
            vacancy.companyId,
            vacancy.employerProfileId,
        );

        await this.repository.delete({ id: vacancyId });
    }
}

export default VacancyController;
