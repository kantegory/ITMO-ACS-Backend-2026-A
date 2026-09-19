import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import CuisineTypeController from './controllers/cuisine-type.controller';
import RestaurantController from './controllers/restaurant.controller';
import ReviewController from './controllers/review.controller';
import MenuItemController from './controllers/menu-item.controller';
import ReservationController from './controllers/reservation.controller';
import RestaurantPhotoController from './controllers/restaurant-photo.controller';

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

        app.use(cors());
        app.use(express.json());
        app.get('/', (req, res) => {
            res.json({
                message: 'Restaurant Booking API',
                version: '1.0.0',
                documentation: 'http://localhost:8000/docs',
                apiPrefix: '/api',
            });
        });

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [
                AuthController,
                UserController,
                CuisineTypeController,
                RestaurantController,
                ReviewController,
                MenuItemController,
                ReservationController,
                RestaurantPhotoController,
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
        } catch (err) {
            console.error('Error during Data Source initialization:', err);
            process.exit(1);
        }

        this.app.listen(this.port, this.host, () => {
            console.log(
                `Running server on ${this.protocol}://${this.host}:${this.port}`,
            );
            console.log(
                `Swagger docs: ${this.protocol}://${this.host}:${this.port}/docs`,
            );
        });
    }
}

const app = new App();
app.start();

export default app;
