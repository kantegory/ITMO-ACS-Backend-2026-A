import { startService } from '@jobsearch/common';
import { dataSource } from './db';
import { jwks } from './auth';
import RecommendationController from './controllers/recommendation.controller';
import InternalController from './controllers/internal.controller';
import { autoBuild } from './indexer';
import { startRecommendationConsumer } from './consumer';

startService({
    name: 'recommendation-service', port: parseInt(process.env.PORT || '8006'), dataSource, jwks,
    controllers: [RecommendationController, InternalController],
    onReady: async () => {
        startRecommendationConsumer();
        autoBuild().catch((e) => console.warn('[индекс]', e?.message));
    },
});
