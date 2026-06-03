import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';

import PropertiesController from './controllers/properties.controller';
import AttributesController from './controllers/attributes.controller';
import PropertyLocationsController from './controllers/property-locations.controller';
import PropertyImagesController from './controllers/property-images.controller';
import {InternalPropertiesController} from "./controllers/properties.controller";
import { connectRabbitMQ } from './rabbitmq/connection';
import { startConsumer } from './rabbitmq/consumer';
import { setupConsumers } from './rabbitmq/setup-consumers';

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
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        app.use('/uploads', express.static(uploadsDir));

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            // controllers: [__dirname + this.controllersPath],
            controllers: [
                PropertiesController,
                AttributesController,
                PropertyLocationsController,
                PropertyImagesController,
                InternalPropertiesController
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
        await dataSource.initialize();
        console.log('Data Source has been initialized!');

        await connectRabbitMQ();
        setupConsumers();
        await startConsumer('property-service');

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
