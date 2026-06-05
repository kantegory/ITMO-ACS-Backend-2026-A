import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';

import AuthController from './controllers/auth.controller';
import ProfileController from './controllers/profile.controller';
import PropertyController from './controllers/property.controller';
import FavoriteController from './controllers/favorite.controller';
import RentalController from './controllers/rental.controller';
import TransactionController from './controllers/transaction.controller';
import ConversationController from './controllers/conversation.controller';
import ReviewController from './controllers/review.controller';
import LandlordController from './controllers/landlord.controller';

const ALL_CONTROLLERS = [
    AuthController,
    ProfileController,
    PropertyController,
    FavoriteController,
    RentalController,
    TransactionController,
    ConversationController,
    ReviewController,
    LandlordController,
];

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
        let app = express();

        app.use(cors());
        app.use(express.json());

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: ALL_CONTROLLERS,
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        };

        app = useExpressServer(app, options);
        app = useSwagger(app, options);

        return app;
    }

    public start(): void {
        dataSource
            .initialize()
            .then(() => {
                console.log('Data Source has been initialized!');
            })
            .catch((err) => {
                console.error('Error during Data Source initialization:', err);
            });

        this.app.listen(this.port, this.host, () => {
            console.log(
                `Running server on ${this.protocol}://${this.host}:${this.port}`,
            );
        });
    }
}

const app = new App();
app.start();

export default app;
