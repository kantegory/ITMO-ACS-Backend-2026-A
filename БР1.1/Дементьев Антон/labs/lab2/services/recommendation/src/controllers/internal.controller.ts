import { IsIn, IsOptional } from 'class-validator';
import { Body, Get, JsonController, Param, Post, Res } from 'routing-controllers';
import { Response } from 'express';
import { In } from 'typeorm';
import { fail, isUuid } from '@jobsearch/common';

import { dataSource } from '../db';
import { rebuild } from '../indexer';
import { IndexJob } from '../models/index.entities';

class RebuildDto { @IsOptional() @IsIn(['VACANCIES', 'RESUMES', 'ALL']) scope: string = 'ALL' }
const jobView = (j: IndexJob) => ({ job_id: j.id, scope: j.scope, status: j.status, processed_items: j.processedItems, started_at: j.startedAt, finished_at: j.finishedAt ?? null });

// Приём событий vacancy.*/resume.* теперь выполняет consumer.ts (RabbitMQ), а не HTTP-эндпоинт —
// см. ДЗ5: startRecommendationConsumer() в app.ts.
@JsonController('/internal/v1')
class InternalController {
    @Post('/index/rebuild')
    async rebuild(@Body({ type: RebuildDto }) body: RebuildDto, @Res() res: Response) {
        const repo = dataSource.getRepository(IndexJob);
        if (await repo.existsBy({ status: In(['QUEUED', 'RUNNING']) })) throw fail('INDEX_REBUILD_IN_PROGRESS');
        const job = await repo.save({ scope: body.scope, status: 'QUEUED' });
        rebuild(body.scope, job.id).catch(() => undefined);
        res.status(202).json(jobView(job));
        return res;
    }

    @Get('/index/rebuild/:jobId')
    async job(@Param('jobId') jobId: string) {
        const j = isUuid(jobId) ? await dataSource.getRepository(IndexJob).findOneBy({ id: jobId }) : null;
        if (!j) throw fail('JOB_NOT_FOUND');
        return jobView(j);
    }
}
export default InternalController;
