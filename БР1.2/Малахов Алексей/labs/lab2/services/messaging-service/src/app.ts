import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import ConversationController from './controllers/conversation.controller';

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());

        useExpressServer(this.app, {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [ConversationController],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }

    public start(): void {
        dataSource.initialize()
            .then(() => console.log('[messaging-service] DB connected'))
            .catch(err => console.error('[messaging-service] DB error:', err));

        this.app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`[messaging-service] running on ${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    }
}

new App().start();
