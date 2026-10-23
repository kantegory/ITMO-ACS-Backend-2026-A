import { startService } from '@jobsearch/common';
import { dataSource } from './db';
import { jwks } from './auth';
import ApplicationController from './controllers/application.controller';
import InternalController from './controllers/internal.controller';
import { startReconcileJob } from './reconcile';

startService({
    name: 'application-service', port: parseInt(process.env.PORT || '8005'), dataSource, jwks,
    controllers: [ApplicationController, InternalController],
    onReady: async () => { startReconcileJob(); },
});
