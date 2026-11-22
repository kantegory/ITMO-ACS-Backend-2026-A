import 'reflect-metadata';

import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';
import internalKeyMiddleware from './middlewares/internal-key.middleware';
import { startRecipeDeletedConsumer } from './utils/rabbitmq';
import CommentController from './controllers/comment.controller';
import LikeController from './controllers/like.controller';
import SavedRecipeController from './controllers/saved-recipe.controller';
import SubscriptionController from './controllers/subscription.controller';
import InternalController from './controllers/internal.controller';

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
        // все запросы — только через bff-service (проверка общего ключа)
        app.use(internalKeyMiddleware);

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            // controllers: [__dirname + this.controllersPath],
            controllers: [
                CommentController,
                LikeController,
                SavedRecipeController,
                SubscriptionController,
                InternalController,
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
            .then(() => {
                console.log('Data Source has been initialized!');

                // база готова — начинаем слушать очередь «рецепт удалён»
                startRecipeDeletedConsumer();
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
