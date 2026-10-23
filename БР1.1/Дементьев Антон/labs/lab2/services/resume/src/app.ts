import { startOutboxDispatcher, startService } from '@jobsearch/common';
import { dataSource } from './db';
import { jwks } from './auth';
import ResumeController from './controllers/resume.controller';
import InternalController from './controllers/internal.controller';

startService({
    name: 'resume-service', port: parseInt(process.env.PORT || '8004'), dataSource, jwks,
    controllers: [ResumeController, InternalController],
    onReady: async () => { startOutboxDispatcher(dataSource); },
});
