import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { ErrorRequestHandler } from 'express';
import { useExpressServer } from 'routing-controllers';
import { QueryFailedError } from 'typeorm';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import AuthController from './controllers/auth.controller';
import UsersController from './controllers/users.controller';
import ReferenceController from './controllers/reference.controller';
import RestaurantsController from './controllers/restaurants.controller';
import ReservationsController from './controllers/reservations.controller';
import AdminController from './controllers/admin.controller';
import { ApiError } from './common/api-error';
import { bootstrapData } from './utils/bootstrap-data';

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

        // middlewares section
        app.use(cors());
        app.use(express.json());

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [
                AuthController,
                UsersController,
                ReferenceController,
                RestaurantsController,
                ReservationsController,
                AdminController,
            ],
            validation: {
                whitelist: true,
                forbidNonWhitelisted: true,
            },
            classTransformer: true,
            defaultErrorHandler: false,
        };

        app = useExpressServer(app, options);
        app = useSwagger(app, options);
        app.use(this.errorHandler);

        return app;
    }

    private errorHandler: ErrorRequestHandler = (
        error: any,
        _request,
        response,
        _next,
    ) => {
        if (error?.errors) {
            response.status(422).send({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Validation failed',
                    details: error.errors,
                },
            });
            return;
        }

        if (error instanceof ApiError) {
            response.status(error.httpCode).send({
                error: {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                },
            });
            return;
        }

        if (error instanceof QueryFailedError) {
            response.status(409).send({
                error: {
                    code: 'CONFLICT',
                    message: 'Database conflict',
                },
            });
            return;
        }

        response.status(error?.httpCode || 500).send({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: error?.message || 'Unexpected server error',
            },
        });
    };

    public async start(): Promise<void> {
        try {
            await dataSource.initialize();
            await bootstrapData();
            console.log('Data Source has been initialized!');
        } catch (err) {
            console.error('Error during Data Source initialization:', err);
            process.exit(1);
        }

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
