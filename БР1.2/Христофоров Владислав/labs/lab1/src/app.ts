import 'reflect-metadata';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';
import SETTINGS from './config/settings';
import dataSource from './config/data-source';
import { useSwagger } from './swagger';

import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { RecipeController } from './controllers/recipe.controller';
import { BlogPostController } from './controllers/blog-post.controller';
import { CommentController } from './controllers/comment.controller';
import { DictionaryController } from './controllers/dictionary.controller';
import { AdminController } from './controllers/admin.controller';
import { MediaController } from './controllers/media.controller';

class App {
    private expressApp: express.Express;

    constructor() {
        this.expressApp = express();
        this.configureApp();
    }

    private configureApp() {
        this.expressApp.use(cors());
        this.expressApp.use(express.json());
        this.expressApp.use(express.urlencoded({ extended: true }));
        this.expressApp.use(
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
            validation: {
                whitelist: true,
                forbidNonWhitelisted: true,
            },
            classTransformer: true,
            defaultErrorHandler: true,
        };

        useExpressServer(this.expressApp, options);
        useSwagger(this.expressApp, options);
    }

    public async start() {
        try {
            await dataSource.initialize();
            console.log('Data Source has been initialized!');
            this.expressApp.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
                console.log(
                    `Server running on http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
                );
            });
        } catch (err) {
            console.error('Error during initialization:', err);
        }
    }
}

const appInstance = new App();
appInstance.start();
export default appInstance;
