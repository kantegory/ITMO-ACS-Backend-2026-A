import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import AuthController from './controllers/auth.controller';

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());

        useExpressServer(this.app, {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [AuthController],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }

    public start(): void {
        dataSource.initialize()
            .then(() => console.log('[auth-service] DB connected'))
            .catch(err => console.error('[auth-service] DB error:', err));

        this.app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`[auth-service] running on ${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    }
}

new App().start();
