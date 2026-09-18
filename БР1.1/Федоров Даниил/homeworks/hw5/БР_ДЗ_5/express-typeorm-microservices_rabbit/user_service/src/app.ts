import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';

import AuthController from './controllers/auth.controller';
import SeekerProfileController from './controllers/seeker-profile.controller';
import EmployerProfileController from './controllers/employer-profile.controller';
import InternalUserCOntroller from './controllers/internal-user.controller';

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
            // controllers: [__dirname + this.controllersPath],
            controllers: [
                AuthController,
                SeekerProfileController,
                EmployerProfileController,
                InternalUserCOntroller,

                
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
        // establish database connection
        dataSource
            .initialize()
            .then( () => {

                console.log('User Service database has been initialized!');
            })
            .catch((err) => {
                console.error('Error during User Service initialization:', err);
            });

        this.app.listen(this.port, this.host, () => {
            console.log(
                `User Service running on ${this.protocol}://${this.host}:${this.port}`,
            );

            console.log(
                `Swagger: ${this.protocol}://${this.host}:${this.port}/docs`,
            );
        });
    }
}

const app = new App();
app.start();

export default app;
