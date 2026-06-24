import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import CategoriesController from './controllers/categories.controller';
import CarpetsController from './controllers/carpets.controller';
import CarpetImagesController from './controllers/carpet-images.controller';
import ReviewsController from './controllers/reviews.controller';
import CartController from './controllers/cart.controller';
import OrdersController from './controllers/orders.controller';
import AdminController from './controllers/admin.controller';
import { ensureAdminUser } from './bootstrap/ensure-admin';

class App {
    public port: number;
    public host: string;
    public protocol: string;
    public controllersPath: string;

    private app: express.Application;

    constructor(
        port = SETTINGS.APP_PORT,
        host = SETTINGS.APP_HOST,
        protocol = SETTINGS.APP_PROTOCOL,
        controllersPath = SETTINGS.APP_CONTROLLERS_PATH,
    ) {
        this.port = port;
        this.host = host;
        this.protocol = protocol;

        this.controllersPath = controllersPath;

        this.app = this.configureApp();
    }

    private configureApp(): express.Application {
        let app = express();

        // middlewares section
        app.use(cors());
        app.use(express.json());

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            // controllers: [__dirname + this.controllersPath],
            controllers: [
                AuthController,
                UserController,
                CategoriesController,
                CarpetsController,
                CarpetImagesController,
                ReviewsController,
                CartController,
                OrdersController,
                AdminController,
            ],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        };

        app = useExpressServer(app, options);
        app = useSwagger(app, options);

        return app;
    }

    public async start(): Promise<void> {
        try {
            await dataSource.initialize();
            console.log('Data Source has been initialized!');

            await ensureAdminUser(dataSource);

            this.app.listen(this.port, this.host, () => {
                console.log(
                    `Running server on ${this.protocol}://${this.host}:${this.port}`,
                );
            });
        } catch (err) {
            console.error('Startup error:', err);
            process.exitCode = 1;
        }
    }
}

const app = new App();
void app.start();

export default app;
