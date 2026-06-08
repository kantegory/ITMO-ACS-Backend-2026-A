import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';
import swaggerUi from 'swagger-ui-express';

import dataSource from './config/data-source';
import SETTINGS from './config/settings';

import AuthController from './controllers/auth.controller';
import UserController from './controllers/user.controller';
import FollowController from './controllers/follow.controller';

const app = express();

const controllers = [
    AuthController,
    UserController,
    FollowController,
];

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ service: 'auth-service', status: 'ok' });
});

const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Auth Service API',
        version: '1.0.0',
        description: 'API для регистрации, авторизации, пользователей и подписок',
    },
    paths: {
        '/api/auth/register': {
            post: {
                summary: 'Register new user',
                responses: {
                    200: {
                        description: 'User registered',
                    },
                },
            },
        },
        '/api/auth/login': {
            post: {
                summary: 'Login user',
                responses: {
                    200: {
                        description: 'JWT token and user data',
                    },
                },
            },
        },
        '/api/users/': {
            get: {
                summary: 'Get users list',
                responses: {
                    200: {
                        description: 'Users list',
                    },
                },
            },
            post: {
                summary: 'Create user',
                responses: {
                    200: {
                        description: 'User created',
                    },
                },
            },
        },
        '/api/users/me': {
            get: {
                summary: 'Get current authorized user',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Current user',
                    },
                },
            },
        },
        '/api/users/details': {
            get: {
                summary: 'Get user by id',
                parameters: [
                    {
                        name: 'id',
                        in: 'query',
                        required: true,
                        schema: {
                            type: 'number',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'User details',
                    },
                },
            },
        },
        '/api/users/update': {
            patch: {
                summary: 'Update user',
                parameters: [
                    {
                        name: 'id',
                        in: 'query',
                        required: true,
                        schema: {
                            type: 'number',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'User updated',
                    },
                },
            },
        },
        '/api/users/delete': {
            delete: {
                summary: 'Delete user',
                parameters: [
                    {
                        name: 'id',
                        in: 'query',
                        required: true,
                        schema: {
                            type: 'number',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'User deleted',
                    },
                },
            },
        },
        '/api/follows/': {
            get: {
                summary: 'Get follows list',
                responses: {
                    200: {
                        description: 'Follows list',
                    },
                },
            },
            post: {
                summary: 'Create follow',
                responses: {
                    200: {
                        description: 'Follow created',
                    },
                },
            },
        },
        '/api/follows/delete': {
            delete: {
                summary: 'Delete follow by id',
                parameters: [
                    {
                        name: 'id',
                        in: 'query',
                        required: true,
                        schema: {
                            type: 'number',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Follow deleted',
                    },
                },
            },
        },
        '/api/follows/by-users': {
            delete: {
                summary: 'Delete follow by users',
                parameters: [
                    {
                        name: 'followerId',
                        in: 'query',
                        required: true,
                        schema: {
                            type: 'number',
                        },
                    },
                    {
                        name: 'followingId',
                        in: 'query',
                        required: true,
                        schema: {
                            type: 'number',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Follow deleted',
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
            `auth-service started: http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
        );
        console.log(
            `auth-service docs: http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}/docs`,
        );
    });
});