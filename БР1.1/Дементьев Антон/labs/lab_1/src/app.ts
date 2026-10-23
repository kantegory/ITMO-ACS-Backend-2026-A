import './config/timezone';
import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import { seedReferenceData } from './seed';
import requestIdMiddleware from './middlewares/request-id.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.middleware';

import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import ReferenceController from './controllers/reference.controller';
import ResumeController from './controllers/resume.controller';
import CompanyController from './controllers/company.controller';
import VacancyController from './controllers/vacancy.controller';
import ApplicationController from './controllers/application.controller';
import FavoriteController from './controllers/favorite.controller';
import RecommendationController from './controllers/recommendation.controller';
import HealthController from './controllers/health.controller';
import DevController from './controllers/dev.controller';

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
        app.use(requestIdMiddleware);

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            // controllers: [__dirname + this.controllersPath],
            controllers: [
                AuthController,
                UserController,
                ReferenceController,
                ResumeController,
                CompanyController,
                VacancyController,
                ApplicationController,
                FavoriteController,
                RecommendationController,
                HealthController,
                // тестовый «почтовый ящик»: только при MAIL_DEBUG=true
                ...(SETTINGS.MAIL_DEBUG ? [DevController] : []),
            ],
            validation: { whitelist: true },
            classTransformer: true,
            // ошибки обрабатывает наш errorHandler (единый формат из ДЗ 2)
            defaultErrorHandler: false,
        };

        app = useExpressServer(app, options);
        app = useSwagger(app, options);

        // неизвестные адреса и ошибки — строго после всех маршрутов
        app.use(notFoundHandler);
        app.use(errorHandler);

        return app;
    }

    public async start(): Promise<void> {
        // establish database connection
        try {
            await dataSource.initialize();
            console.log('Data Source has been initialized!');
            if (SETTINGS.SEED_ON_START) await seedReferenceData();
            if (SETTINGS.MAIL_DEBUG) {
                console.warn('MAIL_DEBUG включён: доступен GET /dev/mailbox. Используйте только для тестов!');
            }
        } catch (err) {
            console.error('Error during Data Source initialization:', err);
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
