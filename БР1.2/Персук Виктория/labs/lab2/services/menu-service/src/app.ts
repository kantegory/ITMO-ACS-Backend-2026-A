import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import MenuItemController, { MenuController } from './controllers/menu-item.controller';
import InternalController from './controllers/internal.controller';

class App {
    private app: express.Application;

    constructor() {
        this.app = this.configureApp();
    }

    private configureApp(): express.Application {
        let app = express();
        app.use(cors());
        app.use(express.json());

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [MenuItemController, MenuController, InternalController],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        };

        app = useExpressServer(app, options);
        app = useSwagger(app, options);
        return app;
    }

    public start(): void {
        dataSource.initialize()
            .then(() => console.log('Menu DB connected'))
            .catch((err) => console.error('Menu DB connection error:', err));

        this.app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`menu-service running on ${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    }
}

const app = new App();
app.start();

export default app;
