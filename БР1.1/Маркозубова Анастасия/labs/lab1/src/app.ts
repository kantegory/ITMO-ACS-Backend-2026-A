import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import resetDatabase from './bootstrap/reset-database';
import { formatErrorResponse } from './common/api-error-response';
import AuthController from './controllers/auth.controller';
import SeekerController from './controllers/seeker.controller';
import CompanyController from './controllers/company.controller';
import ResumeController from './controllers/resume.controller';
import EducationController from './controllers/education.controller';
import ExperienceController from './controllers/experience.controller';
import VacancyController from './controllers/vacancy.controller';
import ApplicationController from './controllers/application.controller';
import IndustryController from './controllers/industry.controller';
import SpecializationController from './controllers/specialization.controller';
import { Server } from 'http';
import seedReferenceData from './bootstrap/seed-reference-data';
import seedDemoData from './bootstrap/seed-demo-data';

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
                SeekerController,
                CompanyController,
                ResumeController,
                EducationController,
                ExperienceController,
                VacancyController,
                ApplicationController,
                IndustryController,
                SpecializationController,
            ],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: false,
        };

        app = useExpressServer(app, options);
        app = useSwagger(app, options);
        app.get('/', (_req, res) => {
            res.redirect('/docs');
        });
        app.use(
            (
                err: any,
                req: express.Request,
                res: express.Response,
                next: express.NextFunction,
            ) => {
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
                        statusCode >= 500
                            ? 'Internal server error'
                            : err?.message || 'Request failed',
                        req.originalUrl,
                        err?.errors,
                    ),
                );
            },
        );

        return app;
    }

    public async start(): Promise<void> {
        try {
            if (!dataSource.isInitialized) {
                await dataSource.initialize();
                if (SETTINGS.DB_RESET_ON_START) {
                    await resetDatabase();
                }
                await seedReferenceData();
                if (SETTINGS.SEED_DEMO_DATA_ON_START) {
                    await seedDemoData();
                }
                console.log('Data Source has been initialized!');
            }

            const server: Server = this.app.listen(this.port, this.host, () => {
                console.log(
                    `Running server on ${this.protocol}://${this.host}:${this.port}`,
                );
            });

            server.on('error', (err: NodeJS.ErrnoException) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(
                        `Port ${this.port} is already in use. Stop the previous dev server or change APP_PORT in .env.`,
                    );
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
