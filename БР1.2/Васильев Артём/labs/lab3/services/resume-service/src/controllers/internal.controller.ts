import { Body, Post, UseBefore } from 'routing-controllers';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import internalAuthMiddleware from '../middlewares/internal-auth.middleware';
import { Resume } from '../models/resume.entity';

@EntityController({
    baseRoute: '/internal/v1/resumes',
    entity: Resume,
})
class InternalResumeController extends BaseController {
    @Post('/batch')
    @UseBefore(internalAuthMiddleware)
    async getResumesBatch(@Body() body: { ids?: string[] }) {
        const ids = [...new Set(body.ids ?? [])];
        const resumes = ids.length
            ? ((await this.repository.findBy({ id: In(ids) })) as Resume[])
            : [];
        const foundIds = new Set(resumes.map((resume) => resume.id));

        return {
            items: resumes,
            missingIds: ids.filter((id) => !foundIds.has(id)),
        };
    }
}

export default InternalResumeController;
