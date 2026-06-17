import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';
import swaggerUi from 'swagger-ui-express';

import dataSource from './config/data-source';
import SETTINGS from './config/settings';

import RecipeController from './controllers/recipe.controller';
import IngredientController from './controllers/ingredient.controller';
import DishTypeController from './controllers/dish-type.controller';
import RecipeStepController from './controllers/recipe-step.controller';

const app = express();

const controllers = [
    RecipeController,
    IngredientController,
    DishTypeController,
    RecipeStepController,
];

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ service: 'recipe-service', status: 'ok' });
});

const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Recipe Service API',
        version: '1.0.0',
        description: 'API для рецептов, ингредиентов, типов блюд и шагов приготовления',
    },
    paths: {
        '/api/recipes/': {
            get: {
                summary: 'Get recipes list',
                responses: {
                    200: {
                        description: 'Recipes list',
                    },
                },
            },
            post: {
                summary: 'Create recipe',
                responses: {
                    200: {
                        description: 'Recipe created',
                    },
                },
            },
        },
        '/api/recipes/details': {
            get: {
                summary: 'Get recipe by id',
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
                        description: 'Recipe details',
                    },
                },
            },
        },
        '/api/recipes/update': {
            patch: {
                summary: 'Update recipe',
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
                        description: 'Recipe updated',
                    },
                },
            },
        },
        '/api/recipes/delete': {
            delete: {
                summary: 'Delete recipe',
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
                        description: 'Recipe deleted',
                    },
                },
            },
        },
        '/api/ingredients/': {
            get: {
                summary: 'Get ingredients list',
                responses: {
                    200: {
                        description: 'Ingredients list',
                    },
                },
            },
            post: {
                summary: 'Create ingredient',
                responses: {
                    200: {
                        description: 'Ingredient created',
                    },
                },
            },
        },
        '/api/ingredients/details': {
            get: {
                summary: 'Get ingredient by id',
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
                        description: 'Ingredient details',
                    },
                },
            },
        },
        '/api/ingredients/update': {
            patch: {
                summary: 'Update ingredient',
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
                        description: 'Ingredient updated',
                    },
                },
            },
        },
        '/api/ingredients/delete': {
            delete: {
                summary: 'Delete ingredient',
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
                        description: 'Ingredient deleted',
                    },
                },
            },
        },
        '/api/dish-types/': {
            get: {
                summary: 'Get dish types list',
                responses: {
                    200: {
                        description: 'Dish types list',
                    },
                },
            },
            post: {
                summary: 'Create dish type',
                responses: {
                    200: {
                        description: 'Dish type created',
                    },
                },
            },
        },
        '/api/dish-types/details': {
            get: {
                summary: 'Get dish type by id',
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
                        description: 'Dish type details',
                    },
                },
            },
        },
        '/api/dish-types/update': {
            patch: {
                summary: 'Update dish type',
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
                        description: 'Dish type updated',
                    },
                },
            },
        },
        '/api/dish-types/delete': {
            delete: {
                summary: 'Delete dish type',
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
                        description: 'Dish type deleted',
                    },
                },
            },
        },
        '/api/recipe-steps/': {
            get: {
                summary: 'Get recipe steps list',
                responses: {
                    200: {
                        description: 'Recipe steps list',
                    },
                },
            },
            post: {
                summary: 'Create recipe step',
                responses: {
                    200: {
                        description: 'Recipe step created',
                    },
                },
            },
        },
        '/api/recipe-steps/details': {
            get: {
                summary: 'Get recipe step by id',
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
                        description: 'Recipe step details',
                    },
                },
            },
        },
        '/api/recipe-steps/update': {
            patch: {
                summary: 'Update recipe step',
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
                        description: 'Recipe step updated',
                    },
                },
            },
        },
        '/api/recipe-steps/delete': {
            delete: {
                summary: 'Delete recipe step',
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
                        description: 'Recipe step deleted',
                    },
                },
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
            `recipe-service started: http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
        );
        console.log(
            `recipe-service docs: http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}/docs`,
        );
    });
});