import { startOutboxDispatcher, startService } from '@jobsearch/common';
import { dataSource } from './db';
import { jwks } from './auth';
import CompanyController from './controllers/company.controller';
import VacancyController from './controllers/vacancy.controller';
import FavoriteController from './controllers/favorite.controller';
import InternalController from './controllers/internal.controller';

startService({
    name: 'vacancy-service', port: parseInt(process.env.PORT || '8003'), dataSource, jwks,
    controllers: [CompanyController, VacancyController, FavoriteController, InternalController],
    onReady: async () => { startOutboxDispatcher(dataSource); },
});
