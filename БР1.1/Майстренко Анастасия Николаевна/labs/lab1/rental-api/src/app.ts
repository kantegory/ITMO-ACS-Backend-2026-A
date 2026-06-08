import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';

import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import PropertyController from './controllers/property.controller';
import AmenityController from './controllers/amenity.controller';
import BookingController from './controllers/booking.controller';
import ConversationController from './controllers/conversation.controller';

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
            controllers: [
                AuthController,
                UserController,
                PropertyController,
                AmenityController,
                BookingController,
                ConversationController,
            ],
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
                this.app.listen(this.port, this.host, () => {
                    console.log(
                        `Running server on ${this.protocol}://${this.host}:${this.port}`,
                    );
                    console.log(
                        `Swagger UI: ${this.protocol}://${this.host}:${this.port}/docs`,
                    );
                });
            })
            .catch((err) => {
                console.error('Error during Data Source initialization:', err);
            });
    }
}

const app = new App();
app.start();

export default app;
