import {
    BadRequestError,
    Body,
    Delete,
    ForbiddenError,
    Get,
    HttpError,
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

import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import allowRoles from '../middlewares/role.middleware';

import { UserRole } from '../models/enums';
import { Vacancy } from '../models/vacancy.entity';
import { VacancySkill } from '../models/vacancy-skill.entity';

import SETTINGS from '../config/settings';

import {
    buildPaginationMeta,
    getPagination,
} from '../common/pagination';

import {
    serializeVacancyDetail,
    serializeVacancyShort,
    ResolvedEmployer,
    ResolvedExperience,
    ResolvedIndustry,
    ResolvedSkill,
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

//тип ответа от Reference Service 
interface ReferenceResolveResponse{
    experiences: ResolvedExperience[];
    industries: ResolvedIndustry[];
    skills: ResolvedSkill[];
}

@EntityController({
    baseRoute: '',
    entity: Vacancy,
})


class VacanciesController extends BaseController {
    private vacancyRepository = dataSource.getRepository(Vacancy);
    private vacancySkillRepository = dataSource.getRepository(VacancySkill);


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

    //http хэлпер
    private async getEmployer(employerId:number): Promise<ResolvedEmployer> {
        let response: Response;
        try {
            response = await fetch(`${SETTINGS.USER_SERVICE_URL}/internal/employers/${employerId}`,
                {
                    headers: {
                        'X-Service-Token': SETTINGS.INTERNAL_SERVICE_TOKEN,
                    },
                },
             );
        } catch (error) {throw new HttpError(503, 'User Service недоступен');}

        if (response.status === 404) {
            throw new NotFoundError('Работодатель не найден');
        }
        
        if (!response.ok) {
            throw new HttpError(503, 'Ошибка взаимодействия с User Service');
        }
        return await response.json() as ResolvedEmployer;
    }

    //http хэлпер для Reference Service
    private async resolveReferenceData(experienceIds: number[] = [], industryIds: number[] = [], skillIds: number[] = []): Promise<ReferenceResolveResponse> {
        if (experienceIds.length === 0 && industryIds.length === 0 && skillIds.length === 0) {
            return {
                experiences: [],
                industries: [],
                skills: [],
            };
        }

        let response: Response;
        try {
            response = await fetch(`${SETTINGS.REFERENCE_SERVICE_URL}/internal/reference/resolve`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Token': SETTINGS.INTERNAL_SERVICE_TOKEN,
                },
                body: JSON.stringify({
                    experience_ids: experienceIds,
                    industry_ids: industryIds,
                    skill_ids: skillIds,
                }),
            });
        } catch (error) {
            throw new HttpError(503, 'Reference Service недоступен');
        }

        if (response.status === 404) {
            throw new NotFoundError('Один или несколько элементов справочника не найдены');
        }

        if (!response.ok) {
            throw new HttpError(503, 'Ошибка взаимодействия с Reference Service');
        }

        return await response.json() as ReferenceResolveResponse;
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

        const queryBuilder = this.vacancyRepository.createQueryBuilder('vacancy')

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
            queryBuilder.andWhere('vacancy.experience_id = :experienceId', {
                experienceId: Number(experienceId),
            });
        }

        if (industryId !== undefined) {
            queryBuilder.andWhere('vacancy.industry_id = :industryId', {
                industryId: Number(industryId),
            });
        }

        if (city !== undefined && city.trim() !== '') {
            queryBuilder.andWhere('vacancy.city ILIKE :city', {
                city: `%${city}%`,
            });
        }

        const sortColumnMap: Record<string, string> = {
            created_at: 'vacancy.createdAt',
            salary: 'vacancy.salary',
            title: 'vacancy.title',
        };

        const sortColumn = sortColumnMap[sortBy || 'created_at'];

        queryBuilder
            .orderBy(sortColumn, normalizedSortOrder)
            .skip(pagination.skip)
            .take(pagination.perPage);

        const [vacancies, total] = await queryBuilder.getManyAndCount();

        const items = [];

        for (const vacancy of vacancies) {
            const referenceData = await this.resolveReferenceData(
                [vacancy.experienceId],
                [vacancy.industryId],
            );

            items.push(serializeVacancyShort(
                vacancy,
                referenceData.experiences[0],
                referenceData.industries[0],
            ));
        }
        return {
            items: items,
            pagination: buildPaginationMeta(
                pagination.page,
                pagination.perPage,
                total,
            ),
        };
    }

    @Get('/vacancies/:vacancyId')
    async getVacancyDetail( @Param('vacancyId') vacancyId: number) {
        const vacancy = await this.vacancyRepository.findOne({
                where: {
                    vacancyId:
                        Number(vacancyId),
                },
                relations: {
                    vacancySkills: true,
                },
            });

        if (!vacancy) {throw new NotFoundError('Вакансия не найдена',)}

        const skillIds = vacancy.vacancySkills.map((vacancySkill) => vacancySkill.skillId);

        const employer = await this.getEmployer(
                vacancy.employerId,
            );

        const referenceData = await this.resolveReferenceData(
                [vacancy.experienceId],
                [vacancy.industryId],
                skillIds,
            );

        return serializeVacancyDetail(
            vacancy,
            employer,
            referenceData.experiences[0],
            referenceData.industries[0],
            referenceData.skills,
        );
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
            .where(
                'vacancy.employer_id = :employerId', 
                {
                employerId: Number(employerId),
                }
            );

        const sortColumnMap: Record<string, string> = {
            created_at: 'vacancy.createdAt',
            salary: 'vacancy.salary',
            title: 'vacancy.title',
        };

        const sortColumn = sortColumnMap[sortBy || 'created_at'];

        queryBuilder
            .orderBy(sortColumn, normalizedSortOrder)
            .skip(pagination.skip)
            .take(pagination.perPage);

        const [vacancies, total] = await queryBuilder.getManyAndCount();

        const items = [];

        for (const vacancy of vacancies) {
            const referenceData = await this.resolveReferenceData(
                [vacancy.experienceId],
                [vacancy.industryId],
            );
            
            items.push(serializeVacancyShort(
                vacancy,
                referenceData.experiences[0],
                referenceData.industries[0],
            ));
        }

        return {
            items: items,
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
        @Param('employerId')
        employerId: number,

        @Body()
        body: VacancyCreateDto,

        @Req()
        request: RequestWithUser,
    ) {
        this.ensureEmployerOwner(
            request,
            Number(employerId),
        );

        // Проверяем работодателя через User Service
        const employer = await this.getEmployer(
                Number(employerId),
            );

        // Проверяем опыт, отрасль и навыки
        // через Reference Service
        const referenceData =
            await this.resolveReferenceData(
                [body.experience_id],
                [body.industry_id],
                body.skill_ids || [],
            );

        const vacancy =
            await dataSource.transaction(
                async (manager) => { const newVacancy = manager.create(Vacancy,
                    {
                    employerId: Number(employerId),
                    experienceId: body.experience_id,
                    industryId: body.industry_id,
                    title: body.title,
                    description: body.description,
                    requirements: body.requirements,
                    salary: body.salary,
                    city: body.city,
                },
            );

                await manager.save(newVacancy);

                const vacancySkills =(body.skill_ids || [])
                    .map((skillId) => manager.create(VacancySkill,
                        {
                        vacancy: newVacancy,
                        skillId: skillId,
                        }));

                await manager.save(
                    vacancySkills,
                );

                return newVacancy;
                },
            );

        return serializeVacancyDetail(
            vacancy,
            employer,
            referenceData.experiences[0],
            referenceData.industries[0],
            referenceData.skills,
        );
    }

    @Patch('/employers/:employerId/vacancies/:vacancyId')
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async updateVacancy(
        @Param('employerId')
        employerId: number,

        @Param('vacancyId')
        vacancyId: number,

        @Body()
        body: VacancyUpdateDto,

        @Req()
        request: RequestWithUser,
    ) {
        this.ensureEmployerOwner(request, Number(employerId));

        const vacancy =await this.vacancyRepository.findOne({
                where: {
                    vacancyId:
                        Number(vacancyId),
                    employerId:
                        Number(employerId),
                },
                relations: {
                    vacancySkills: true,
                },
            });

        if (!vacancy) {throw new NotFoundError('Вакансия не найдена')}

        // Какие значения будут после PATCH
        const experienceId = body.experience_id ?? vacancy.experienceId;

        const industryId = body.industry_id ?? vacancy.industryId;

        const skillIds = body.skill_ids ?? vacancy.vacancySkills.map((item) => item.skillId);

        // Одним запросом проверяем все справочные ID
        const referenceData =
            await this.resolveReferenceData(
                [experienceId],
                [industryId],
                skillIds,
            );

        // Обновляем обычные поля
        if (body.experience_id !== undefined){
            vacancy.experienceId = body.experience_id;
        }

        if (body.industry_id !== undefined) {
            vacancy.industryId = body.industry_id;
        }

        if (body.title !== undefined) {
            vacancy.title = body.title;
        }

        if (body.description !== undefined){
            vacancy.description = body.description;
        }

        if (body.requirements !== undefined){
            vacancy.requirements = body.requirements;
        }

        if (body.salary !== undefined){
            vacancy.salary = body.salary;
        }

        if (body.city !== undefined) {
            vacancy.city = body.city;
        }

        await this.vacancyRepository.save(vacancy,);

        // Если skill_ids пришёл в PATCH,
        // полностью заменяем навыки
        if (body.skill_ids !== undefined) {
            await this.vacancySkillRepository
                .createQueryBuilder()
                .delete()
                .from(VacancySkill)
                .where(
                    'vacancy_id = :vacancyId',
                    {
                        vacancyId:
                            vacancy.vacancyId,
                    },
                )
                .execute();

            const newVacancySkills =
                body.skill_ids.map(
                    (skillId) =>
                        this.vacancySkillRepository
                            .create({
                                vacancy:
                                    vacancy,

                                skillId:
                                    skillId,
                            }),
                );

            await this.vacancySkillRepository.save(newVacancySkills);
        }

        const employer = await this.getEmployer(vacancy.employerId);

        return serializeVacancyDetail(
            vacancy,
            employer,
            referenceData.experiences[0],
            referenceData.industries[0],
            referenceData.skills,
        );
    }

    @Delete('/employers/:employerId/vacancies/:vacancyId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async deleteVacancy(
        @Param('employerId')
        employerId: number,

        @Param('vacancyId')
        vacancyId: number,

        @Req()
        request: RequestWithUser,
    ) {
        this.ensureEmployerOwner(request, Number(employerId));

        const vacancy =
            await this.vacancyRepository.findOne({
                where: {
                    vacancyId:
                        Number(vacancyId),

                    employerId:
                        Number(employerId),
                },
            });

        if (!vacancy) {throw new NotFoundError('Вакансия не найдена')}

        await this.vacancyRepository.remove(vacancy);

        return undefined;
    }
}

export default VacanciesController;