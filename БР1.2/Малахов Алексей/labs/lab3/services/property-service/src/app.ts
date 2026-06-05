import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { connectPublisher } from './messaging/publisher';
import { startConsumer } from './messaging/consumer';
import PropertyController from './controllers/property.controller';
import FavoriteController from './controllers/favorite.controller';
import InternalPropertyController from './controllers/internal.controller';

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());

        useExpressServer(this.app, {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [PropertyController, FavoriteController, InternalPropertyController],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }

    public start(): void {
        dataSource.initialize()
            .then(async () => {
                console.log('[property-service] DB connected');
                await connectPublisher();
                await startConsumer();
            })
            .catch(err => console.error('[property-service] DB error:', err));

        this.app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`[property-service] running on ${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    }
}

new App().start();
