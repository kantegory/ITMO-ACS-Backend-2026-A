import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import RestaurantController from './controllers/restaurant.controller';
import CuisineController from './controllers/cuisine.controller';
import PhotoController from './controllers/photo.controller';
import InternalController from './controllers/internal.controller';
import { startReviewConsumer } from './messaging/consumer';

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
            controllers: [RestaurantController, CuisineController, PhotoController, InternalController],
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
            .then(() => {
                console.log('Restaurant DB connected');
                startReviewConsumer();
            })
            .catch((err) => console.error('Restaurant DB connection error:', err));

        this.app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
            console.log(`restaurant-service running on ${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
        });
    }
}

const app = new App();
app.start();

export default app;
