import {
    Body,
    Patch,
    Delete,
    Param,
    UseBefore,
    Req,
    HttpError,
} from 'routing-controllers';

import { IsString, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

import AuthOpenAPI from '../common/auth-openapi';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Experience } from '../models/experience.entity';

import authMiddleware from '../middlewares/auth.middleware';

class UpdateExperienceCheck {
    @IsOptional()
    @IsString()
    @Type(() => String)
    company_name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    position: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description: string;

    @IsOptional()
    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date: string;
}

@EntityController({
    baseRoute: '/experiences',
    entity: Experience,
})
class ExperienceController extends BaseController {
    @Patch('/:id')
    @AuthOpenAPI('Обновить опыт работы', ['resumes'])
    @UseBefore(authMiddleware)
    async update(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: UpdateExperienceCheck }) body: UpdateExperienceCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can update experience');
        }

        const experience = await this.repository.findOne({
            where: {
                experience_id: id,
            },
            relations: ['resume', 'resume.seeker', 'resume.seeker.user'],
        });

        if (!experience) {
            throw new HttpError(404, 'Experience not found');
        }

        if (experience.resume.seeker.user.user_id !== currentUserId) {
            throw new HttpError(403, 'You can update only your own experience');
        }

        if (body.company_name !== undefined) {
            experience.company_name = body.company_name;
        }

        if (body.position !== undefined) {
            experience.position = body.position;
        }

        if (body.description !== undefined) {
            experience.description = body.description;
        }

        if (body.start_date !== undefined) {
            experience.start_date = body.start_date as any;
        }

        if (body.end_date !== undefined) {
            experience.end_date = body.end_date as any;
        }

        return await this.repository.save(experience);
    }

    @Delete('/:id')
    @AuthOpenAPI('Удалить опыт работы', ['resumes'])
    @UseBefore(authMiddleware)
    async delete(
        @Req() request: any,
        @Param('id') id: number,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can delete experience');
        }

        const experience = await this.repository.findOne({
            where: {
                experience_id: id,
            },
            relations: ['resume', 'resume.seeker', 'resume.seeker.user'],
        });

        if (!experience) {
            throw new HttpError(404, 'Experience not found');
        }

        if (experience.resume.seeker.user.user_id !== currentUserId) {
            throw new HttpError(403, 'You can delete only your own experience');
        }

        await this.repository.remove(experience);

        return {
            message: 'Experience deleted successfully',
        };
    }
}

export default ExperienceController;
