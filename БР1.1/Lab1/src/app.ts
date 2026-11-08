import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import { RoutingControllersOptions, useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import AuthController from './controllers/auth.controller';
import RecipesController from './controllers/recipes.controller';
import ReferenceDataController from './controllers/reference-data.controller';
import UserController from './controllers/user.controller';
import ErrorHandlerMiddleware from './middlewares/error-handler.middleware';
import { seedReferenceData } from './seeds/reference-data.seed';
import { useSwagger } from './swagger';

class App {
    public port: number;

    public host: string;

    public protocol: string;

    private app: express.Application;

    constructor(
        port = SETTINGS.APP_PORT,
        host = SETTINGS.APP_HOST,
        protocol = SETTINGS.APP_PROTOCOL,
    ) {
        this.port = port;
        this.host = host;
        this.protocol = protocol;
        this.app = this.configureApp();
    }

    private configureApp(): express.Application {
        const app = express();

        app.use(cors());
        app.use(express.json());

        const options: RoutingControllersOptions = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [
                AuthController,
                UserController,
                RecipesController,
                ReferenceDataController,
            ],
            middlewares: [ErrorHandlerMiddleware],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: false,
        };

        useExpressServer(app, options);
        useSwagger(app, options);

        return app;
    }

    public async start(): Promise<void> {
        try {
            await dataSource.initialize();
            await seedReferenceData(dataSource);

            this.app.listen(this.port, this.host, () => {
                console.log(
                    `Running server on ${this.protocol}://${this.host}:${this.port}`,
                );
            });
        } catch (error) {
            console.error('Error during app initialization:', error);
            process.exit(1);
        }
    }
}

const app = new App();

void app.start();

export default app;
