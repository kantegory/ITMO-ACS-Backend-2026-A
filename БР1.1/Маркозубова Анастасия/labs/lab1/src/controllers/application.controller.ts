import {
    Body,
    Get,
    Patch,
    Param,
    UseBefore,
    Req,
    HttpError,
} from 'routing-controllers';

import { IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

import AuthOpenAPI from '../common/auth-openapi';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Application } from '../models/application.entity';

import authMiddleware from '../middlewares/auth.middleware';

class UpdateApplicationStatusCheck {
    @IsString()
    @IsIn(['sent', 'viewed', 'invited', 'rejected'])
    @Type(() => String)
    status: string;
}

@EntityController({
    baseRoute: '/applications',
    entity: Application,
})
class ApplicationController extends BaseController {
    @Get('/me')
    @AuthOpenAPI('Получить свои отклики', ['applications'])
    @UseBefore(authMiddleware)
    async getMyApplications(@Req() request: any) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'seeker') {
            throw new HttpError(403, 'Only seeker can view own applications');
        }

        return await this.repository.find({
            where: {
                resume: {
                    seeker: {
                        user: {
                            user_id: currentUserId,
                        },
                    },
                },
            },
            relations: ['resume', 'vacancy'],
        });
    }

    @Patch('/:id/status')
    @AuthOpenAPI('Изменить статус отклика', ['applications'])
    @UseBefore(authMiddleware)
    async updateStatus(
        @Req() request: any,
        @Param('id') id: number,
        @Body({ type: UpdateApplicationStatusCheck }) body: UpdateApplicationStatusCheck,
    ) {
        const currentUserId = request.user.user_id;
        const currentUserRole = request.user.role;

        if (currentUserRole !== 'company') {
            throw new HttpError(403, 'Only company can update application status');
        }

        const application = await this.repository.findOne({
            where: {
                application_id: id,
            },
            relations: ['vacancy', 'vacancy.company', 'vacancy.company.user'],
        });

        if (!application) {
            throw new HttpError(404, 'Application not found');
        }

        if (application.vacancy.company.user.user_id !== currentUserId) {
            throw new HttpError(403, 'You can update only applications for your own vacancies');
        }

        application.status = body.status;
        return await this.repository.save(application);
    }
}

export default ApplicationController;
