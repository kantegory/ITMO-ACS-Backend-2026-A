import { BadRequestError, Body, Get, JsonController, NotFoundError, Param, Post, UseBefore } from "routing-controllers";

import { ArrayUnique, IsArray, IsInt } from "class-validator";

import { In } from "typeorm";

import dataSource from "../config/data-source";

import { Employer } from "../models/employer.entity";
import { Resume } from "../models/resume.entity";

import serviceTokenMiddleware from "../middlewares/service-token.middleware";

class ResolveResumeDto{
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true})
    resume_ids: number[];
}

@JsonController('/internal')
@UseBefore(serviceTokenMiddleware)
class InternalUserCOntroller{
    private employerRepository = dataSource.getRepository(Employer);
    private resumeRepository = dataSource.getRepository(Resume);

    @Get('/employers/:employerId')
    async getEmployer( @Param('employerId') employerId: number){
        const employer = await this.employerRepository.findOne({
            where: {
                profileId: Number(employerId)
            },
        });
        
        if (!employer){
            throw new NotFoundError('Работодатель не найден');
        }

        return{
            employer_id: employer.profileId,

            company_name: employer.companyName
        };
        
    }

    @Get('/resumes/:resumeId')
    async getResume(@Param('resumeId') resumeId: number){
        const resume = await this.resumeRepository.findOne({
            where: {
                resumeId: Number(resumeId)
            },
            relations: {
                seeker: {
                    user: true,
                },
            },
        });
    
        if(!resume) {
            throw new NotFoundError('Резюме не найдено');
        }
        return{
            resume_id: resume.resumeId,
            seeker_id: resume.seeker.profileId,
            title: resume.title,
            seeker: {
                first_name: resume.seeker.firstName,
                surname: resume.seeker.surname,
                middle_name: resume.seeker.middleName,
                email: resume.seeker.user.email,
                phone: resume.seeker.user.phone,
            }
        }

    }

    @Post('/resumes/resolve')
    async resolveResumes(@Body() body: ResolveResumeDto){
        if (body.resume_ids.length === 0){
            return{items: []};
        }
        const resumes = await this.resumeRepository.find({
            where: {
                resumeId: In(body.resume_ids)
            },
            relations: {
                seeker: true,
            },
        });
        
        if (resumes.length !== body.resume_ids.length){
            throw new BadRequestError('Одно или несколько резюме не найдены');
       }

       return{items: resumes.map(
        (resume) => ({
            resume_id: resume.resumeId,
            seeker_id: resume.seeker.profileId,
            title: resume.title,
            seeker_full_name:[
                resume.seeker.surname,
                resume.seeker.firstName,
                resume.seeker.middleName,
            ].filter(Boolean).join(' '),
        }),
       )};
    }
}

export default InternalUserCOntroller
