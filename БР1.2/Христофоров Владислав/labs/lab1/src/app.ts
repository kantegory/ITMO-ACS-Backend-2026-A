import 'reflect-metadata';

import express from 'express';
import path from 'path';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';

import AuthController from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { RecipeController } from './controllers/recipe.controller';
import { BlogPostController } from './controllers/blog-post.controller';
import { CommentController } from './controllers/comment.controller';
import { DictionaryController } from './controllers/dictionary.controller';
import { AdminController } from './controllers/admin.controller';
import { MediaController } from './controllers/media.controller';

class App {
    public port: number;
    public host: string;
    public protocol: string;
    public controllersPath: string;

    private app: express.Express;

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

        this.app = express();
        this.configureApp();
    }

    private configureApp(): void {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.app.use(
            '/uploads',
            express.static(path.join(process.cwd(), 'uploads')),
        );

        const options = {
            routePrefix: SETTINGS.APP_API_PREFIX,
            controllers: [
                AuthController,
                UserController,
                RecipeController,
                BlogPostController,
                CommentController,
                DictionaryController,
                AdminController,
                MediaController,
            ],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        };

        useExpressServer(this.app, options);
        useSwagger(this.app, options);
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

const appInstance = new App();
appInstance.start();

export default appInstance;
