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

import { Education } from '../models/education.entity';

import authMiddleware from '../middlewares/auth.middleware';

class UpdateEducationCheck {
    @IsOptional()
    @IsString()
    @Type(() => String)
    institution: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    degree: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    field_of_study: string;

    @IsOptional()
    @IsDateString()
    start_date: string;

    @IsOptional()
    @IsDateString()
    end_date: string;
}

@EntityController({
    baseRoute: '/educations',
    entity: Education,
})
class EducationController extends BaseController {
    @Patch('/:id')
    @AuthOpenAPI('Обновить образование', ['resumes'])
    @UseBefore(authMiddleware)
    async update(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: UpdateEducationCheck }) body: UpdateEducationCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can update education');
        }

        const education = await this.repository.findOne({
            where: {
                education_id: id,
            },
            relations: ['resume', 'resume.seeker', 'resume.seeker.user'],
        });

        if (!education) {
            throw new HttpError(404, 'Education not found');
        }

        if (education.resume.seeker.user.user_id !== currentUserId) {
            throw new HttpError(403, 'You can update only your own education');
        }

        if (body.institution !== undefined) {
            education.institution = body.institution;
        }

        if (body.degree !== undefined) {
            education.degree = body.degree;
        }

        if (body.field_of_study !== undefined) {
            education.field_of_study = body.field_of_study;
        }

        if (body.start_date !== undefined) {
            education.start_date = body.start_date as any;
        }

        if (body.end_date !== undefined) {
            education.end_date = body.end_date as any;
        }

        return await this.repository.save(education);
    }

    @Delete('/:id')
    @AuthOpenAPI('Удалить образование', ['resumes'])
    @UseBefore(authMiddleware)
    async delete(
        @Req() request: any,
        @Param('id') id: number,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can delete education');
        }

        const education = await this.repository.findOne({
            where: {
                education_id: id,
            },
            relations: ['resume', 'resume.seeker', 'resume.seeker.user'],
        });

        if (!education) {
            throw new HttpError(404, 'Education not found');
        }

        if (education.resume.seeker.user.user_id !== currentUserId) {
            throw new HttpError(403, 'You can delete only your own education');
        }

        await this.repository.remove(education);

        return {
            message: 'Education deleted successfully',
        };
    }
}

export default EducationController;
