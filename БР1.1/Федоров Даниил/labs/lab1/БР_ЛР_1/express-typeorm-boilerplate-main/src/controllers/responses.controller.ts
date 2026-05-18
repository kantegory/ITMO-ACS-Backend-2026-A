import {
    BadRequestError,
    Body,
    ForbiddenError,
    Get,
    HttpError,
    NotFoundError,
    Param,
    Post,
    QueryParam,
    Req,
    UseBefore,
} from 'routing-controllers';
import {
    IsInt,
    IsOptional,
    IsString,
} from 'class-validator';

import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import allowRoles from '../middlewares/role.middleware';

import { UserRole, ResponseStatus } from '../models/enums';
import { Vacancy } from '../models/vacancy.entity';
import { Resume } from '../models/resume.entity';
import { ApplicationResponse } from '../models/response.entity';
import { CoverLetter } from '../models/cover-letter.entity';

import {
    buildPaginationMeta,
    getPagination,
} from '../common/pagination';

import {
    serializeEmployerResponseDetail,
    serializeEmployerResponseShort,
} from '../views/serializers';

class CreateResponseDto {
    @IsInt()
    seeker_id: number;

    @IsInt()
    resume_id: number;

    @IsOptional()
    @IsString()
    cover_letter_text?: string;
}

@EntityController({
    baseRoute: '',
    entity: ApplicationResponse,
})
class ResponsesController extends BaseController {
    private vacancyRepository = dataSource.getRepository(Vacancy);
    private resumeRepository = dataSource.getRepository(Resume);
    private responseRepository = dataSource.getRepository(ApplicationResponse);
    private coverLetterRepository = dataSource.getRepository(CoverLetter);

    private getResponseDetailRelations() {
        return {
            vacancy: {
                employer: true,
            },
            coverLetter: {
                response: true,
            },
            resume: {
                seeker: {
                    user: true,
                },
                educations: true,
                experiences: true,
                resumeSkills: {
                    skill: true,
                },
            },
        };
    }

    @Post('/vacancies/:vacancyId/responses')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async createResponse(
        @Param('vacancyId') vacancyId: number,
        @Body() body: CreateResponseDto,
        @Req() request: RequestWithUser,
    ) {
        if (request.user.profileId !== body.seeker_id) {
            throw new ForbiddenError(
                'Нельзя откликаться от имени другого соискателя',
            );
        }

        const vacancy = await this.vacancyRepository.findOne({
            where: {
                vacancyId: Number(vacancyId),
            },
        });

        if (!vacancy) {
            throw new NotFoundError('Вакансия не найдена');
        }

        const resume = await this.resumeRepository.findOne({
            where: {
                resumeId: body.resume_id,
                seeker: {
                    profileId: body.seeker_id,
                },
            },
            relations: {
                seeker: true,
            },
        });

        if (!resume) {
            throw new NotFoundError('Резюме не найдено');
        }

        const existingResponse = await this.responseRepository.findOne({
            where: {
                vacancy: {
                    vacancyId: vacancy.vacancyId,
                },
                resume: {
                    resumeId: resume.resumeId,
                },
            },
        });

        if (existingResponse) {
            throw new HttpError(
                409,
                'Отклик на эту вакансию уже существует',
            );
        }

        const createdResponseId = await dataSource.transaction(
            async (manager) => {
                const response = manager.create(ApplicationResponse, {
                    vacancy: vacancy,
                    resume: resume,
                    status: ResponseStatus.NEW,
                });

                await manager.save(response);

                if (
                    body.cover_letter_text !== undefined &&
                    body.cover_letter_text.trim() !== ''
                ) {
                    const coverLetter = manager.create(CoverLetter, {
                        response: response,
                        text: body.cover_letter_text.trim(),
                    });

                    await manager.save(coverLetter);
                }

                return response.responseId;
            },
        );

        const createdResponse = await this.responseRepository.findOne({
            where: {
                responseId: createdResponseId,
            },
            relations: {
                vacancy: true,
                resume: true,
            },
        });

        if (!createdResponse) {
            throw new NotFoundError('Созданный отклик не найден');
        }

        return {
            message: 'Отклик успешно отправлен',
            response_id: createdResponse.responseId,
            vacancy_id: vacancy.vacancyId,
            resume_id: resume.resumeId,
            status: createdResponse.status,
            created_at: createdResponse.createdAt,
        };
    }

    @Get('/employers/:employerId/responses')
    @UseBefore(authMiddleware, allowRoles(UserRole.EMPLOYER))
    async getEmployerResponses(
        @Param('employerId') employerId: number,
        @Req() request: RequestWithUser,
        @QueryParam('vacancy_id') vacancyId?: number,
        @QueryParam('status') status?: string,
        @QueryParam('page') page?: number,
        @QueryParam('per_page') perPage?: number,
        @QueryParam('sort_by') sortBy?: string,
        @QueryParam('sort_order') sortOrder?: string,
    ) {
        if (request.user.profileId !== Number(employerId)) {
            throw new ForbiddenError(
                'Нет доступа к откликам другого работодателя',
            );
        }

        const allowedSortFields = ['created_at', 'status'];

        if (sortBy !== undefined && !allowedSortFields.includes(sortBy)) {
            throw new BadRequestError('Некорректное поле сортировки');
        }

        if (
            status !== undefined &&
            !Object.values(ResponseStatus).includes(status as ResponseStatus)
        ) {
            throw new BadRequestError('Некорректный статус отклика');
        }

        const normalizedSortOrder =
            sortOrder === 'asc' ? 'ASC' : 'DESC';

        const pagination = getPagination(page, perPage);

        const queryBuilder = this.responseRepository
            .createQueryBuilder('response')
            .leftJoinAndSelect('response.vacancy', 'vacancy')
            .leftJoinAndSelect('response.resume', 'resume')
            .leftJoinAndSelect('resume.seeker', 'seeker')
            .leftJoinAndSelect('seeker.user', 'user')
            .where('vacancy.employer_id = :employerId', {
                employerId: Number(employerId),
            });

        if (vacancyId !== undefined) {
            queryBuilder.andWhere('vacancy.vacancy_id = :vacancyId', {
                vacancyId: Number(vacancyId),
            });
        }

        if (status !== undefined) {
            queryBuilder.andWhere('response.status = :status', {
                status: status,
            });
        }

        const sortColumnMap: Record<string, string> = {
            created_at: 'response.created_at',
            status: 'response.status',
        };

        const sortColumn = sortColumnMap[sortBy || 'created_at'];

        queryBuilder
            .orderBy(sortColumn, normalizedSortOrder)
            .skip(pagination.skip)
            .take(pagination.perPage);

        const [responses, total] = await queryBuilder.getManyAndCount();

        return {
            items: responses.map(serializeEmployerResponseShort),
            pagination: buildPaginationMeta(
                pagination.page,
                pagination.perPage,
                total,
            ),
        };
    }

    @Get('/responses/:responseId')
    @UseBefore(authMiddleware)
    async getResponseDetail(
        @Param('responseId') responseId: number,
        @Req() request: RequestWithUser,
    ) {
        const response = await this.responseRepository.findOne({
            where: {
                responseId: Number(responseId),
            },
            relations: this.getResponseDetailRelations(),
        });

        if (!response) {
            throw new NotFoundError('Отклик не найден');
        }

        if (
            request.user.role === UserRole.EMPLOYER &&
            response.vacancy.employer.profileId !== request.user.profileId
        ) {
            throw new ForbiddenError('Нет доступа к этому отклику');
        }

        if (
            request.user.role === UserRole.SEEKER &&
            response.resume.seeker.profileId !== request.user.profileId
        ) {
            throw new ForbiddenError('Нет доступа к этому отклику');
        }

        return serializeEmployerResponseDetail(response);
    }
}

export default ResponsesController;