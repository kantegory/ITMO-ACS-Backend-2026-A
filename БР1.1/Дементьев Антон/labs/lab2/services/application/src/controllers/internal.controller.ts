import { IsOptional, IsUUID } from 'class-validator';
import { Get, JsonController, QueryParams } from 'routing-controllers';
import { invalid } from '@jobsearch/common';

import { dataSource } from '../db';
import { Application } from '../models/application.entity';

class ExistsQuery { @IsOptional() @IsUUID() vacancy_id?: string; @IsOptional() @IsUUID() resume_id?: string }
class AccessQuery { @IsUUID() resume_id: string; @IsUUID() employer_user_id: string }

@JsonController('/internal/v1/applications')
class InternalController {
    // Замена ON DELETE RESTRICT: есть ли отклики на вакансию или резюме
    @Get('/exists')
    async exists(@QueryParams({ type: ExistsQuery }) q: ExistsQuery) {
        if (!!q.vacancy_id === !!q.resume_id) throw invalid('vacancy_id', 'Нужно передать ровно один из параметров vacancy_id и resume_id');
        const count = await dataSource.getRepository(Application).count({ where: q.vacancy_id ? { vacancyId: q.vacancy_id } : { resumeId: q.resume_id } });
        return { exists: count > 0, count };
    }

    // Доступ работодателя к резюме: есть ли отклик с этим резюме на вакансию его компании
    @Get('/access-check')
    async access(@QueryParams({ type: AccessQuery }) q: AccessQuery) {
        return { allowed: await dataSource.getRepository(Application).existsBy({ resumeId: q.resume_id, employerUserId: q.employer_user_id }) };
    }
}
export default InternalController;
