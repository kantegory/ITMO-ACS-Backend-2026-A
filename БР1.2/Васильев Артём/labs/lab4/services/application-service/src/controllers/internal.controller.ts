import { Body, Get, Param, Post, UseBefore } from 'routing-controllers';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import internalAuthMiddleware from '../middlewares/internal-auth.middleware';
import { ensureFound } from '../common/http-errors';
import { Application } from '../models/application.entity';

@EntityController({
    baseRoute: '/internal/v1',
    entity: Application,
})
class InternalApplicationController extends BaseController {
    @Post('/applications/batch')
    @UseBefore(internalAuthMiddleware)
    async getApplicationsBatch(@Body() body: { ids?: string[] }) {
        const ids = [...new Set(body.ids ?? [])];
        const applications = ids.length
            ? await this.repository.findBy({ id: In(ids) })
            : [];
        const foundIds = new Set(
            applications.map((application) => application.id),
        );

        return {
            items: applications,
            missingIds: ids.filter((id) => !foundIds.has(id)),
        };
    }

    @Get('/users/:user_id/applications')
    @UseBefore(internalAuthMiddleware)
    async listUserApplications(@Param('user_id') userId: string) {
        return {
            items: await this.repository.find({
                where: { userId },
                order: { createdAt: 'DESC' },
            }),
        };
    }
}

export default InternalApplicationController;
