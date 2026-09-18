import {BadRequestError,Body,ForbiddenError,Get,HttpError,NotFoundError,Param,Post,QueryParam,Req,UseBefore,Delete,OnUndefined,} from 'routing-controllers';
import {IsInt,IsOptional,IsString} from 'class-validator';

import dataSource from '../config/data-source';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import SETTINGS from '../config/settings';

import { ResolvedResume, ResolvedVacancy, serializeEmployerResponseDetail, serializeEmployerResponseShort } from '../views/serializers';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import allowRoles from '../middlewares/role.middleware';

import { UserRole, ResponseStatus } from '../models/enums';
import { ApplicationResponse } from '../models/response.entity';
import { CoverLetter } from '../models/cover-letter.entity';

import {
    buildPaginationMeta,
    getPagination,
} from '../common/pagination';

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
    private responseRepository = dataSource.getRepository(ApplicationResponse);

    //хелпер для обращения к vacancy service
    private async getVacancy(vacancyId: number): Promise<ResolvedVacancy>{
        let response: Response;

        try {
            response = await fetch(`${SETTINGS.VACANCY_SERVICE_URL}/internal/vacancies/${vacancyId}`,
                {
                    headers: {
                        'X-Service-Token': SETTINGS.INTERNAL_SERVICE_TOKEN,
                    },
                },
            );
        } catch {throw new HttpError(503, 'Vacancy Service недоступен');
        }

        if (response.status === 404) {
            throw new NotFoundError(
                'Вакансия не найдена',
            );
        }

        if (!response.ok) {
            throw new HttpError(503, 'Ошибка Vacancy Service');
        }

        return await response.json() as ResolvedVacancy;
    }

    //хелпер для обращения к user service

    private async getResume(resumeId: number): Promise<ResolvedResume> {
        let response: Response;

        try {
            response = await fetch(`${SETTINGS.USER_SERVICE_URL}/internal/resumes/${resumeId}`,
                {
                    headers: {
                        'X-Service-Token': SETTINGS.INTERNAL_SERVICE_TOKEN,
                    },
                },
            );
        } catch {throw new HttpError(503, 'User Service недоступен')}

        if (response.status === 404) {
            throw new NotFoundError(
                'Резюме не найдено',
            );
        }

        if (!response.ok) {
            throw new HttpError(503, 'Ошибка User Service');
        }

        return await response.json() as ResolvedResume;
    }


    @Post('/vacancies/:vacancyId/responses')
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async createResponse(
        @Param('vacancyId')
        vacancyId: number,

        @Body()
        body: CreateResponseDto,

        @Req()
        request: RequestWithUser,
    ) {
        if (request.user.profileId !== body.seeker_id) {
            throw new ForbiddenError( 'Нельзя откликаться от имени другого соискателя');
        }

        // Получаем Vacancy через Vacancy Service
        const vacancy = await this.getVacancy(Number(vacancyId));

        // Получаем Resume через User Service
        const resume = await this.getResume(body.resume_id);
        console.log('VACANCY:', vacancy)
        console.log('RESUME:', resume)

        // Проверяем, что резюме принадлежит этому соискателю
        if (resume.seeker_id !==body.seeker_id) {
            throw new ForbiddenError('Нельзя использовать чужое резюме');
        }

        // Проверяем повторный отклик
        const existingResponse = await this.responseRepository.findOne({
                where: {
                    vacancyId:
                        Number(vacancyId),
                    resumeId:
                        body.resume_id,
                },
            });

        if (existingResponse) {
            throw new HttpError(409, 'Отклик на эту вакансию уже существует');
        }

        const createdResponseId =await dataSource.transaction(async (manager) => {
            const newResponse = manager.create(ApplicationResponse,{
                vacancyId: vacancy.vacancy_id,
                resumeId: resume.resume_id,
                seekerId: resume.seeker_id,
                employerId: vacancy.employer_id,
                status: ResponseStatus.NEW,
                },
            );

            await manager.save(newResponse);

            if (body.cover_letter_text !== undefined && body.cover_letter_text.trim() !== '') {
                const coverLetter = manager.create(CoverLetter,{
                    response: newResponse,
                    text: body.cover_letter_text.trim(),
                    },
                );

                await manager.save(coverLetter)}

            return newResponse.responseId;
        },
    );

        const createdResponse =await this.responseRepository.findOne({
                where: {
                    responseId:createdResponseId,
                },
            });

        if (!createdResponse) {
            throw new NotFoundError('Созданный отклик не найден');
        }

        return {
            message: 'Отклик успешно отправлен',

            response_id: createdResponse.responseId,

            vacancy_id: createdResponse.vacancyId,

            resume_id: createdResponse.resumeId,

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
            throw new ForbiddenError('Нет доступа к откликам другого работодателя');
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

        const queryBuilder = this.responseRepository.createQueryBuilder('response')
            .where('response.employerId = :employerId',{
                    employerId:
                        Number(employerId),
                },
            );

        if (vacancyId !== undefined) {
            queryBuilder.andWhere(
                'response.vacancyId = :vacancyId',
                {
                    vacancyId:
                        Number(vacancyId),
                },
            );
        }

        if (status !== undefined) {
            queryBuilder.andWhere(
                'response.status = :status',
                {
                    status: status,
                },
            );
        }

        const sortColumnMap: Record<string, string> = {
            created_at: 'response.createdAt',
            status: 'response.status',
            };

        const sortColumn = sortColumnMap[ sortBy || 'created_at'];

        queryBuilder
            .orderBy(
                sortColumn,
                normalizedSortOrder,
            )
            .skip(
                pagination.skip,
            )
            .take(
                pagination.perPage,
            );

        const [responses, total] = await queryBuilder.getManyAndCount();

        const items = [];

        for (const response of responses) {
            const vacancy = await this.getVacancy(response.vacancyId);

            const resume = await this.getResume(response.resumeId);

            items.push(
                serializeEmployerResponseShort(
                    response,
                    vacancy,
                    resume,
                ),
            );
        }

        return {
            items: items,

            pagination:
                buildPaginationMeta(
                    pagination.page,
                    pagination.perPage,
                    total,
                ),
        };
    }

    @Get('/responses/:responseId')
    @UseBefore(authMiddleware)
    async getResponseDetail(
    @Param('responseId')
    responseId: number,

    @Req()
    request: RequestWithUser,
    ) {
        const response =await this.responseRepository.findOne({
                where: {
                    responseId: Number(responseId),
                },

                relations: {
                    coverLetter: {
                        response: true,
                    },
                },
            });

        if (!response) {throw new NotFoundError('Отклик не найден')}

        if (request.user.role === UserRole.EMPLOYER && response.employerId !== request.user.profileId) {
            throw new ForbiddenError('Нет доступа к этому отклику');
        }

        if (request.user.role === UserRole.SEEKER && response.seekerId !== request.user.profileId) {
            throw new ForbiddenError('Нет доступа к этому отклику');
        }

        const vacancy = await this.getVacancy(response.vacancyId);

        const resume = await this.getResume(response.resumeId);

        return serializeEmployerResponseDetail(
            response,
            vacancy,
            resume,
        );
    }

    @Delete('/responses/:responseId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, allowRoles(UserRole.SEEKER))
    async deleteResponse(
        @Param('responseId')
        responseId: number,

        @Req()
        request: RequestWithUser,
    ) {
        const response =await this.responseRepository.findOne({
            where: {
                    responseId: Number(responseId),
                },
            });

        if (!response) {throw new NotFoundError('Отклик не найден')}

        if (response.seekerId !== request.user.profileId) {
            throw new ForbiddenError('Нет доступа к удалению этого отклика');
        }

        await this.responseRepository.remove(response);

        return undefined;
    }

}

export default ResponsesController;