import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';
import swaggerUi from 'swagger-ui-express';

import dataSource from './config/data-source';
import SETTINGS from './config/settings';

import CommentController from './controllers/comment.controller';
import LikeController from './controllers/like.controller';
import SavedRecipeController from './controllers/saved-recipe.controller';

const app = express();

const controllers = [
    CommentController,
    LikeController,
    SavedRecipeController,
];

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ service: 'social-service', status: 'ok' });
});

const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Social Service API',
        version: '1.0.0',
        description: 'API для комментариев, лайков и сохраненных рецептов',
    },
    paths: {
        '/api/comments/': {
            get: {
                summary: 'Get comments list',
                responses: {
                    200: {
                        description: 'Comments list',
                    },
                },
            },
            post: {
                summary: 'Create comment',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Comment created',
                    },
                },
            },
        },
        '/api/likes/': {
            get: {
                summary: 'Get likes list',
                responses: {
                    200: {
                        description: 'Likes list',
                    },
                },
            },
            post: {
                summary: 'Create like',
                responses: {
                    200: {
                        description: 'Like created',
                    },
                },
            },
        },
        '/api/likes/delete': {
            delete: {
                summary: 'Delete like by id',
                responses: {
                    200: {
                        description: 'Like deleted',
                    },
                },
            },
        },
        '/api/saved-recipes/': {
            get: {
                summary: 'Get saved recipes list',
                responses: {
                    200: {
                        description: 'Saved recipes list',
                    },
                },
            },
            post: {
                summary: 'Save recipe',
                responses: {
                    200: {
                        description: 'Recipe saved',
                    },
                },
            },
        },
        '/api/saved-recipes/delete': {
            delete: {
                summary: 'Delete saved recipe by id',
                responses: {
                    200: {
                        description: 'Saved recipe deleted',
                    },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
};

dataSource.initialize().then(() => {
    useExpressServer(app, {
        routePrefix: SETTINGS.APP_API_PREFIX,
        controllers,
        validation: true,
    });

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
        console.log(
            `social-service started: http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
        );
        console.log(
            `social-service docs: http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}/docs`,
        );
    });
});