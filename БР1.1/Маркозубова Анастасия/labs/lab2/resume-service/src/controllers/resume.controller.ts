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

import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

import AuthOpenAPI, { PublicOpenAPI } from '../common/auth-openapi';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Resume } from '../models/resume.entity';
import { Education } from '../models/education.entity';
import { Experience } from '../models/experience.entity';

import authMiddleware from '../middlewares/auth.middleware';
import { assertExists, requestService } from '../common/service-client';

class CreateResumeCheck {
    @IsString()
    @Type(() => String)
    title: string;

    @IsInt()
    @Type(() => Number)
    specialization_id: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    desired_salary: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    experience_years: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    location: string;
}

class UpdateResumeCheck {
    @IsOptional()
    @IsString()
    @Type(() => String)
    title: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    specialization_id: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    desired_salary: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    experience_years: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    location: string;
}

class CreateResumeEducationCheck {
    @IsString()
    @Type(() => String)
    institution: string;

    @IsString()
    @Type(() => String)
    degree: string;

    @IsString()
    @Type(() => String)
    field_of_study: string;

    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date: string;
}

class CreateResumeExperienceCheck {
    @IsString()
    @Type(() => String)
    company_name: string;

    @IsString()
    @Type(() => String)
    position: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description: string;

    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date: string;
}

function getUpdatedAtOrder(updated_at_order?: string): 'ASC' | 'DESC' {
    return String(updated_at_order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
}

@EntityController({
    baseRoute: '/resumes',
    entity: Resume,
})
class ResumeController extends BaseController {
    @Get('/internal/:id')
    async getInternalById(@Param('id') id: number) {
        const resume = await this.repository.findOneBy({ resume_id: id });

        if (!resume) {
            throw new HttpError(404, 'Resume not found');
        }

        return resume;
    }

    @Get('/internal/:id/ownership')
    async getInternalOwnership(
        @Param('id') id: number,
        @QueryParam('user_id') user_id: number,
    ) {
        const resume = await this.repository.findOneBy({ resume_id: id });

        if (!resume) {
            throw new HttpError(404, 'Resume not found');
        }

        const seeker = await requestService<{ seeker_id: number }>(
            'profile',
            `/seekers/internal/by-user/${user_id}`,
        );

        return {
            owns: resume.seeker_id === seeker.seeker_id,
            resume,
        };
    }

    @Post('')
    @AuthOpenAPI('Создать резюме', ['resumes'])
    @UseBefore(authMiddleware)
    async create(
        @Req() request: any,
        @Body({ type: CreateResumeCheck }) body: CreateResumeCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can create resume');
        }

        const seeker = await requestService<{ seeker_id: number }>(
            'profile',
            `/seekers/internal/by-user/${currentUserId}`,
        );
        await assertExists(
            'reference',
            `/specializations/internal/${body.specialization_id}`,
            'Specialization not found',
        );

        const resume = this.repository.create({
            title: body.title,
            specialization_id: body.specialization_id,
            desired_salary: body.desired_salary,
            experience_years: body.experience_years,
            location: body.location,
            seeker_id: seeker.seeker_id,
        });

        const savedResume = await this.repository.save(resume);
        return savedResume;
    }

    @Get('/me')
    @AuthOpenAPI('Получить свои резюме', ['resumes'])
    @UseBefore(authMiddleware)
    async getMyResumes(
        @Req() request: any,
        @QueryParam('updated_at_order') updated_at_order?: string,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can view resumes');
        }

        const seeker = await requestService<{ seeker_id: number }>(
            'profile',
            `/seekers/internal/by-user/${currentUserId}`,
        );

        const resumes = await this.repository.find({
            where: {
                seeker_id: seeker.seeker_id,
            },
            relations: ['educations', 'experiences'],
            order: {
                updated_at: getUpdatedAtOrder(updated_at_order),
            },
        });

        return resumes;
    }

    @Get('/:id')
    @PublicOpenAPI('Получить резюме', ['resumes'])
    async getById(@Param('id') id: number) {
        const resume = await this.repository.findOne({
            where: {
                resume_id: id,
            },
            relations: ['educations', 'experiences'],
        });

        if (!resume) {
            throw new HttpError(404, 'Resume not found');
        }

        return resume;
    }

    @Patch('/:id')
    @AuthOpenAPI('Обновить резюме', ['resumes'])
    @UseBefore(authMiddleware)
    async update(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: UpdateResumeCheck }) body: UpdateResumeCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can update resume');
        }

        const resume = await this.repository.findOne({
            where: {
                resume_id: id,
            },
        });

        if (!resume) {
            throw new HttpError(404, 'Resume not found');
        }

        const seeker = await requestService<{ seeker_id: number }>(
            'profile',
            `/seekers/internal/by-user/${currentUserId}`,
        );

        if (resume.seeker_id !== seeker.seeker_id) {
            throw new HttpError(403, 'You can update only your own resume');
        }

        if (body.title !== undefined) {
            resume.title = body.title;
        }

        if (body.desired_salary !== undefined) {
            resume.desired_salary = body.desired_salary;
        }

        if (body.experience_years !== undefined) {
            resume.experience_years = body.experience_years;
        }

        if (body.location !== undefined) {
            resume.location = body.location;
        }

        if (body.specialization_id !== undefined) {
            await assertExists(
                'reference',
                `/specializations/internal/${body.specialization_id}`,
                'Specialization not found',
            );
            resume.specialization_id = body.specialization_id;
        }

        const updatedResume = await this.repository.save(resume);
        return updatedResume;
    }

    @Delete('/:id')
    @AuthOpenAPI('Удалить резюме', ['resumes'])
    @UseBefore(authMiddleware)
    async delete(@Req() request: any, @Param('id') id: number) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can delete resume');
        }

        const resume = await this.repository.findOne({
            where: {
                resume_id: id,
            },
        });

        if (!resume) {
            throw new HttpError(404, 'Resume not found');
        }

        const seeker = await requestService<{ seeker_id: number }>(
            'profile',
            `/seekers/internal/by-user/${currentUserId}`,
        );

        if (resume.seeker_id !== seeker.seeker_id) {
            throw new HttpError(403, 'You can delete only your own resume');
        }

        await this.repository.remove(resume);

        return {
            message: 'Resume deleted successfully',
        };
    }

    @Post('/:id/educations')
    @AuthOpenAPI('Добавить образование', ['resumes'])
    @UseBefore(authMiddleware)
    async createEducation(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: CreateResumeEducationCheck })
        body: CreateResumeEducationCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can add education');
        }

        const resume = await this.repository.findOne({
            where: {
                resume_id: id,
            },
        });

        if (!resume) {
            throw new HttpError(404, 'Resume not found');
        }

        const seeker = await requestService<{ seeker_id: number }>(
            'profile',
            `/seekers/internal/by-user/${currentUserId}`,
        );

        if (resume.seeker_id !== seeker.seeker_id) {
            throw new HttpError(
                403,
                'You can add education only to your own resume',
            );
        }

        const educationRepository = Education.getRepository();
        const education = educationRepository.create({
            institution: body.institution,
            degree: body.degree,
            field_of_study: body.field_of_study,
            start_date: body.start_date,
            end_date: body.end_date,
            resume,
        });

        return await educationRepository.save(education);
    }

    @Post('/:id/experiences')
    @AuthOpenAPI('Добавить опыт работы', ['resumes'])
    @UseBefore(authMiddleware)
    async createExperience(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: CreateResumeExperienceCheck })
        body: CreateResumeExperienceCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can add experience');
        }

        const resume = await this.repository.findOne({
            where: {
                resume_id: id,
            },
        });

        if (!resume) {
            throw new HttpError(404, 'Resume not found');
        }

        const seeker = await requestService<{ seeker_id: number }>(
            'profile',
            `/seekers/internal/by-user/${currentUserId}`,
        );

        if (resume.seeker_id !== seeker.seeker_id) {
            throw new HttpError(
                403,
                'You can add experience only to your own resume',
            );
        }

        const experienceRepository = Experience.getRepository();
        const experience = experienceRepository.create({
            company_name: body.company_name,
            position: body.position,
            description: body.description,
            start_date: body.start_date,
            end_date: body.end_date,
            resume,
        });

        return await experienceRepository.save(experience);
    }
}

export default ResumeController;
