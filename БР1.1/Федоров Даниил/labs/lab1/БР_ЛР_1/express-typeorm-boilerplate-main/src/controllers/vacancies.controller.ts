import {
    BadRequestError,
    Body,
    Delete,
    ForbiddenError,
    Get,
    NotFoundError,
    OnUndefined,
    Param,
    Patch,
    Post,
    QueryParam,
    Req,
    UseBefore,
} from 'routing-controllers';
import {
    ArrayUnique,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { In } from 'typeorm';

import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import allowRoles from '../middlewares/role.middleware';

import { UserRole } from '../models/enums';
import { Employer } from '../models/employer.entity';
import { ExperienceOption } from '../models/experience-option.entity';
import { Industry } from '../models/industry.entity';
import { Skill } from '../models/skill.entity';
import { Vacancy } from '../models/vacancy.entity';
import { VacancySkill } from '../models/vacancy-skill.entity';

import {
    buildPaginationMeta,
    getPagination,
} from '../common/pagination';

import {
    serializeVacancyDetail,
    serializeVacancyShort,
} from '../views/serializers';

class VacancyCreateDto {
    @IsInt()
    experience_id: number;

    @IsInt()
    industry_id: number;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsString()
    requirements: string;

    @IsInt()
    @Min(0)
    salary: number;

    @IsString()
    city: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    skill_ids?: number[];
}

class VacancyUpdateDto {
    @IsOptional()
    @IsInt()
    experience_id?: number;

    @IsOptional()
    @IsInt()
    industry_id?: number;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    requirements?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    salary?: number;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    skill_ids?: number[];
}

@EntityController({
    baseRoute: '',
    entity: Vacancy,
})


class VacanciesController extends BaseController {
    private vacancyRepository = dataSource.getRepository(Vacancy);
    private employerRepository = dataSource.getRepository(Employer);
    private experienceRepository = dataSource.getRepository(ExperienceOption);
    private industryRepository = dataSource.getRepository(Industry);
    private skillRepository = dataSource.getRepository(Skill);
    private vacancySkillRepository = dataSource.getRepository(VacancySkill);

    private getVacancyDetailRelations() {
        return {
            employer: true,
            experience: true,
            industry: true,
            vacancySkills: {
                skill: true,
            },
        };
    }

    private ensureEmployerOwner(
        request: RequestWithUser,
        employerId: number,
    ) {
        if (request.user.profileId !== employerId) {
            throw new ForbiddenError(
                'Нет доступа к вакансиям другого работодателя',
            );
        }
    }

    @Get('/vacancies')
    async getVacancies(
        @QueryParam('search') search?: string,
        @QueryParam('salary_from') salaryFrom?: number,
        @QueryParam('salary_to') salaryTo?: number,
        @QueryParam('experience_id') experienceId?: number,
        @QueryParam('industry_id') industryId?: number,
        @QueryParam('city') city?: string,
        @QueryParam('page') page?: number,
        @QueryParam('per_page') perPage?: number,
        @QueryParam('sort_by') sortBy?: string,
        @QueryParam('sort_order') sortOrder?: string,
    ) {
        const allowedSortFields = ['created_at', 'salary', 'title'];

        if (sortBy !== undefined && !allowedSortFields.includes(sortBy)) {
            throw new BadRequestError('Некорректное поле сортировки');
        }

        const normalizedSortOrder =
            sortOrder === 'asc' ? 'ASC' : 'DESC';

        const pagination = getPagination(page, perPage);

        const queryBuilder = this.vacancyRepository
            .createQueryBuilder('vacancy')
            .leftJoinAndSelect('vacancy.employer', 'employer')
            .leftJoinAndSelect('vacancy.experience', 'experience')
            .leftJoinAndSelect('vacancy.industry', 'industry');

        if (search !== undefined && search.trim() !== '') {
            queryBuilder.andWhere(
                `(
                    vacancy.title ILIKE :search
                    OR vacancy.description ILIKE :search
                    OR vacancy.requirements ILIKE :search
                )`,
                {
                    search: `%${search}%`,
                },
            );
        }

        if (salaryFrom !== undefined) {
            queryBuilder.andWhere('vacancy.salary >= :salaryFrom', {
                salaryFrom: Number(salaryFrom),
            });
        }

        if (salaryTo !== undefined) {
            queryBuilder.andWhere('vacancy.salary <= :salaryTo', {
                salaryTo: Number(salaryTo),
            });
        }

        if (experienceId !== undefined) {
            queryBuilder.andWhere('experience.experience_id = :experienceId', {
                experienceId: Number(experienceId),
            });
        }

        if (industryId !== undefined) {
            queryBuilder.andWhere('industry.industry_id = :industryId', {
                industryId: Number(industryId),
            });
        }

        if (city !== undefined && city.trim() !== '') {
            queryBuilder.andWhere('vacancy.city ILIKE :city', {
                city: `%${city}%`,
            });
        }

        const sortColumnMap: Record<string, string> = {
            created_at: 'vacancy.created_at',
            salary: 'vacancy.salary',
            title: 'vacancy.title',
        };

        const sortColumn = sortColumnMap[sortBy || 'created_at'];

        queryBuilder
            .orderBy(sortColumn, normalizedSortOrder)
            .skip(pagination.skip)
            .take(pagination.perPage);

        const [vacancies, total] = await queryBuilder.getManyAndCount();

        return {
            items: vacancies.map(serializeVacancyShort),
            pagination: buildPaginationMeta(
                pagination.page,
                pagination.perPage,
                total,
            ),
        };
    }

    @Get('/vacancies/:vacancyId')
    async getVacancyDetail(@Param('vacancyId') vacancyId: number) {
        const vacancy = await this.vacancyRepository.findOne({
            where: {
                vacancyId: Number(vacancyId),
            },
            relations: this.getVacancyDetailRelations(),
        });

        if (!vacancy) {
            throw new NotFoundError('Вакансия не найдена');
        }

        return serializeVacancyDetail(vacancy);
    }

    @Get('/employers/:employerId/vacancies')
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async getEmployerVacancies(
        @Param('employerId') employerId: number,
        @Req() request: RequestWithUser,
        @QueryParam('page') page?: number,
        @QueryParam('per_page') perPage?: number,
        @QueryParam('sort_by') sortBy?: string,
        @QueryParam('sort_order') sortOrder?: string,
    ) {
        this.ensureEmployerOwner(request, Number(employerId));

        const allowedSortFields = ['created_at', 'salary', 'title'];

        if (sortBy !== undefined && !allowedSortFields.includes(sortBy)) {
            throw new BadRequestError('Некорректное поле сортировки');
        }

        const normalizedSortOrder =
            sortOrder === 'asc' ? 'ASC' : 'DESC';

        const pagination = getPagination(page, perPage);

        const queryBuilder = this.vacancyRepository
            .createQueryBuilder('vacancy')
            .leftJoinAndSelect('vacancy.employer', 'employer')
            .leftJoinAndSelect('vacancy.experience', 'experience')
            .leftJoinAndSelect('vacancy.industry', 'industry')
            .where('employer.profile_id = :employerId', {
                employerId: Number(employerId),
            });

        const sortColumnMap: Record<string, string> = {
            created_at: 'vacancy.created_at',
            salary: 'vacancy.salary',
            title: 'vacancy.title',
        };

        const sortColumn = sortColumnMap[sortBy || 'created_at'];

        queryBuilder
            .orderBy(sortColumn, normalizedSortOrder)
            .skip(pagination.skip)
            .take(pagination.perPage);

        const [vacancies, total] = await queryBuilder.getManyAndCount();

        return {
            items: vacancies.map(serializeVacancyShort),
            pagination: buildPaginationMeta(
                pagination.page,
                pagination.perPage,
                total,
            ),
        };
    }

    @Post('/employers/:employerId/vacancies')
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async createVacancy(
        @Param('employerId') employerId: number,
        @Body() body: VacancyCreateDto,
        @Req() request: RequestWithUser,
    ) {
        this.ensureEmployerOwner(request, Number(employerId));

        const employer = await this.employerRepository.findOne({
            where: {
                profileId: Number(employerId),
            },
        });

        if (!employer) {
            throw new NotFoundError('Работодатель не найден');
        }

        const experience = await this.experienceRepository.findOne({
            where: {
                experienceId: body.experience_id,
            },
        });

        if (!experience) {
            throw new NotFoundError('Вариант опыта работы не найден');
        }

        const industry = await this.industryRepository.findOne({
            where: {
                industryId: body.industry_id,
            },
        });

        if (!industry) {
            throw new NotFoundError('Отрасль не найдена');
        }

        let skills: Skill[] = [];

        if (body.skill_ids !== undefined && body.skill_ids.length > 0) {
            skills = await this.skillRepository.findBy({
                skillId: In(body.skill_ids),
            });

            if (skills.length !== body.skill_ids.length) {
                throw new NotFoundError('Один или несколько навыков не найдены');
            }
        }

        const createdVacancyId = await dataSource.transaction(
            async (manager) => {
                const vacancy = manager.create(Vacancy, {
                    employer: employer,
                    experience: experience,
                    industry: industry,
                    title: body.title,
                    description: body.description,
                    requirements: body.requirements,
                    salary: body.salary,
                    city: body.city,
                });

                await manager.save(vacancy);

                const vacancySkills = skills.map((skill) =>
                    manager.create(VacancySkill, {
                        vacancy: vacancy,
                        skill: skill,
                    }),
                );

                await manager.save(vacancySkills);

                return vacancy.vacancyId;
            },
        );

        const createdVacancy = await this.vacancyRepository.findOne({
            where: {
                vacancyId: createdVacancyId,
            },
            relations: this.getVacancyDetailRelations(),
        });

        if (!createdVacancy) {
            throw new NotFoundError('Созданная вакансия не найдена');
        }

        return serializeVacancyDetail(createdVacancy);
    }

    @Patch('/employers/:employerId/vacancies/:vacancyId')
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async updateVacancy(
        @Param('employerId') employerId: number,
        @Param('vacancyId') vacancyId: number,
        @Body() body: VacancyUpdateDto,
        @Req() request: RequestWithUser,
    ) {
        this.ensureEmployerOwner(request, Number(employerId));

        const vacancy = await this.vacancyRepository.findOne({
            where: {
                vacancyId: Number(vacancyId),
                employer: {
                    profileId: Number(employerId),
                },
            },
            relations: this.getVacancyDetailRelations(),
        });

        if (!vacancy) {
            throw new NotFoundError('Вакансия не найдена');
        }

        if (body.experience_id !== undefined) {
            const experience = await this.experienceRepository.findOne({
                where: {
                    experienceId: body.experience_id,
                },
            });

            if (!experience) {
                throw new NotFoundError('Вариант опыта работы не найден');
            }

            vacancy.experience = experience;
        }

        if (body.industry_id !== undefined) {
            const industry = await this.industryRepository.findOne({
                where: {
                    industryId: body.industry_id,
                },
            });

            if (!industry) {
                throw new NotFoundError('Отрасль не найдена');
            }

            vacancy.industry = industry;
        }

        if (body.title !== undefined) {
            vacancy.title = body.title;
        }

        if (body.description !== undefined) {
            vacancy.description = body.description;
        }

        if (body.requirements !== undefined) {
            vacancy.requirements = body.requirements;
        }

        if (body.salary !== undefined) {
            vacancy.salary = body.salary;
        }

        if (body.city !== undefined) {
            vacancy.city = body.city;
        }

        await this.vacancyRepository.save(vacancy);

        if (body.skill_ids !== undefined) {
            let skills: Skill[] = [];

            if (body.skill_ids.length > 0) {
                skills = await this.skillRepository.findBy({
                    skillId: In(body.skill_ids),
                });

                if (skills.length !== body.skill_ids.length) {
                    throw new NotFoundError(
                        'Один или несколько навыков не найдены',
                    );
                }
            }

            await this.vacancySkillRepository
                .createQueryBuilder()
                .delete()
                .from(VacancySkill)
                .where('vacancy_id = :vacancyId', {
                    vacancyId: vacancy.vacancyId,
                })
                .execute();

            const newVacancySkills = skills.map((skill) =>
                this.vacancySkillRepository.create({
                    vacancy: vacancy,
                    skill: skill,
                }),
            );

            await this.vacancySkillRepository.save(newVacancySkills);
        }

        const updatedVacancy = await this.vacancyRepository.findOne({
            where: {
                vacancyId: vacancy.vacancyId,
            },
            relations: this.getVacancyDetailRelations(),
        });

        if (!updatedVacancy) {
            throw new NotFoundError('Вакансия не найдена');
        }

        return serializeVacancyDetail(updatedVacancy);
    }

    @Delete('/employers/:employerId/vacancies/:vacancyId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async deleteVacancy(
        @Param('employerId') employerId: number,
        @Param('vacancyId') vacancyId: number,
        @Req() request: RequestWithUser,
    ) {
        this.ensureEmployerOwner(request, Number(employerId));

        const vacancy = await this.vacancyRepository.findOne({
            where: {
                vacancyId: Number(vacancyId),
                employer: {
                    profileId: Number(employerId),
                },
            },
        });

        if (!vacancy) {
            throw new NotFoundError('Вакансия не найдена');
        }

        await this.vacancyRepository.remove(vacancy);

        return undefined;
    }
}

export default VacanciesController;
