import { BadRequestError, Body, Get, JsonController, NotFoundError, Param, Post, UseBefore } from "routing-controllers";

import { ArrayUnique, IsArray, IsInt } from "class-validator";

import { In } from "typeorm";

import dataSource from "../config/data-source";

import { Vacancy } from "../models/vacancy.entity";

import serviceTokenMiddleware from "../middlewares/service-token.middleware";

class ResolveVacanciesDto {
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    vacancy_ids: number[]
}

@JsonController('/internal/vacancies')
@UseBefore(serviceTokenMiddleware)
class InternalVacancyController {
    private vacancyRepository = dataSource.getRepository(Vacancy);


    @Get('/:vacancyId')
    async getVacancy(@Param('vacancyId') vacancyId: number){
        const vacancy = await this.vacancyRepository.findOne({
            where: {
                vacancyId: Number(vacancyId),
            },
        });
        
        if(!vacancy){throw new NotFoundError('Вакансия не найдена')}

        return{
            vacancy_id: vacancy.vacancyId,
            employer_id: vacancy.employerId,
            title: vacancy.title

        };


    }

    @Post('/resolve')
    async resolveVacancies(@Body() body: ResolveVacanciesDto){
        if (body.vacancy_ids.length === 0){
            return {items: []}
        }

        const vacancies = await this.vacancyRepository.find({
            where: {
                vacancyId: In(body.vacancy_ids),
            },
        });

        if(vacancies.length !== body.vacancy_ids.length){
            throw new BadRequestError('Одна или несколько вакансий не найдены')
        }

        return{
            items: vacancies.map((vacancy) => ({
                vacancy_id: vacancy.vacancyId,
                employer_id: vacancy.employerId,
                title: vacancy.title
            }))
        }
    }
}

export default InternalVacancyController