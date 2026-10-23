import { startService } from '@jobsearch/common';
import { dataSource } from './db';
import { jwks } from './auth';
import ReferenceController from './controllers/reference.controller';
import { seedReferenceData } from './seed';

startService({
    name: 'reference-service', port: parseInt(process.env.PORT || '8002'), dataSource, jwks,
    controllers: [ReferenceController],
    onReady: async () => { if (process.env.SEED_ON_START !== 'false') await seedReferenceData(); },
});
