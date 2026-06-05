import { DataSource } from 'typeorm';

import SETTINGS from './settings';

import {
    Comment,
    DifficultyLevel,
    Favorite,
    Ingredient,
    Recipe,
    RecipeCategory,
    RecipeIngredient,
    RecipeLike,
    RecipeMedia,
    RecipeStep,
    User,
} from '../models';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [
        User,
        RecipeCategory,
        DifficultyLevel,
        Ingredient,
        Recipe,
        RecipeIngredient,
        RecipeStep,
        RecipeMedia,
        Comment,
        RecipeLike,
        Favorite,
    ],
    logging: true,
    synchronize: true,
});

export default dataSource;
