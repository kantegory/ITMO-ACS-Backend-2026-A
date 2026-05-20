import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { getServiceConfig, ServiceName } from './config/service-config';
import { useSwagger } from './swagger';
import resetDatabase from './bootstrap/reset-database';
import seedReferenceData from './bootstrap/seed-reference-data';
import { formatErrorResponse } from './common/api-error-response';

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

        const currentService = getServiceConfig(SETTINGS.SERVICE_NAME as ServiceName);
        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: currentService.controllers,
            validation: true,
            classTransformer: true,
            defaultErrorHandler: false,
        };

        app = useExpressServer(app, options);
        app = useSwagger(app, options);
        app.get('/', (_req, res) => res.redirect('/docs'));
        app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (res.headersSent) {
                next(err);
                return;
            }
            const statusCode = err?.httpCode || err?.statusCode || 500;
            if (statusCode >= 500) {
                console.error('Unhandled server error:', err);
            }
            res.status(statusCode).json(
                formatErrorResponse(
                    statusCode,
                    statusCode >= 500 ? 'Internal server error' : err?.message || 'Request failed',
                    req.originalUrl,
                    err?.errors,
                ),
            );
        });
        return app;
    }

    public async start(): Promise<void> {
        try {
            if (!dataSource.isInitialized) {
                await dataSource.initialize();
                if (SETTINGS.DB_RESET_ON_START) {
                    await resetDatabase();
                }
                                console.log(`${SETTINGS.SERVICE_NAME} Data Source has been initialized!`);
            }

            const server: Server = this.app.listen(this.port, this.host, () => {
                console.log(`Running ${SETTINGS.SERVICE_NAME} service on ${this.protocol}://${this.host}:${this.port}`);
            });

            server.on('error', (err: NodeJS.ErrnoException) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(`Port ${this.port} is already in use.`);
                    return;
                }
                console.error('Server startup error:', err);
            });
        } catch (err) {
            console.error('Error during Data Source initialization:', err);
        }
    }
}

const app = new App();
app.start();

export default app;
