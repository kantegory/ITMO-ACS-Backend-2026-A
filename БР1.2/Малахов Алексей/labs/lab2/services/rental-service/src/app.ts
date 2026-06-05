import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { connectPublisher } from './messaging/publisher';
import RentalController from './controllers/rental.controller';
import TransactionController from './controllers/transaction.controller';
import InternalRentalController from './controllers/internal.controller';

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());

        useExpressServer(this.app, {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [RentalController, TransactionController, InternalRentalController],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }

    public start(): void {
        dataSource.initialize()
            .then(() => console.log('[rental-service] DB connected'))
            .catch(err => console.error('[rental-service] DB error:', err));

        connectPublisher();

        this.app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`[rental-service] running on ${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    }
}

new App().start();
