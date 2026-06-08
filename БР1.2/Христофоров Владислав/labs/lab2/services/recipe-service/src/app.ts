import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { useExpressServer } from 'routing-controllers';
import dataSource from './config/data-source';
import rabbitMQService from './utils/rabbitmq';

import { InternalRecipeController } from './controllers/internal.controller';
import { RecipeController } from './controllers/recipe.controller';
import { DictionaryController } from './controllers/dictionary.controller';
import { AdminController } from './controllers/admin.controller';
import { SavedRecipeController } from './controllers/saved-recipe.controller';

import { Recipe } from './models/recipe.entity';

const app = express();
const PORT = process.env.APP_PORT || 8002;

app.use(cors());

useExpressServer(app, {
    routePrefix: process.env.APP_API_PREFIX || '/api/v1',
    controllers: [
        RecipeController,
        DictionaryController,
        AdminController,
        SavedRecipeController,
    ],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

useExpressServer(app, {
    routePrefix: '',
    controllers: [InternalRecipeController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: true,
});

const start = async () => {
    try {
        await dataSource.initialize();
        console.log('✅ Recipe Database connected!');

        // ПОДКЛЮЧАЕМСЯ К RABBITMQ И СЛУШАЕМ ОЧЕРЕДЬ
        await rabbitMQService.connect();
        await rabbitMQService.consume(
            'user_events',
            'recipe_service_user_deleted_queue',
            async (msg) => {
                console.log(
                    `[Recipe Service] Получено событие об удалении пользователя: ${msg.userId}`,
                );
                const recipeRepo = dataSource.getRepository(Recipe);
                const recipes = await recipeRepo.find({
                    where: { author_id: msg.userId },
                });
                if (recipes.length > 0) {
                    await recipeRepo.softRemove(recipes);
                    console.log(
                        `[Recipe Service] Удалено рецептов: ${recipes.length}`,
                    );
                }
            },
        );

        app.listen(PORT, () => {
            console.log(`🚀 Recipe Service is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error:', err);
    }
};

start();
