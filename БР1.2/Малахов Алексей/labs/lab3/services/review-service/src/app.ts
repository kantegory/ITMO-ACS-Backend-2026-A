import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { startConsumer } from './messaging/consumer';
import ReviewController from './controllers/review.controller';
import LandlordController from './controllers/landlord.controller';
import InternalReviewController from './controllers/internal.controller';

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());

        useExpressServer(this.app, {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [ReviewController, LandlordController, InternalReviewController],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }

    public start(): void {
        dataSource.initialize()
            .then(async () => {
                console.log('[review-service] DB connected');
                await startConsumer();
            })
            .catch(err => console.error('[review-service] DB error:', err));

        this.app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`[review-service] running on ${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    }
}

new App().start();
