import 'reflect-metadata';

import { DataSource } from 'typeorm';

import SETTINGS from '../shared/settings';
import { DifficultyLevel } from './entities/difficulty-level.entity';
import { Ingredient } from './entities/ingredient.entity';
import { RecipeCategory } from './entities/recipe-category.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeMedia } from './entities/recipe-media.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { Recipe } from './entities/recipe.entity';

const recipeDataSource = new DataSource({
    type: 'postgres',
    ...SETTINGS.RECIPE_DB,
    entities: [
        RecipeCategory,
        DifficultyLevel,
        Ingredient,
        Recipe,
        RecipeIngredient,
        RecipeStep,
        RecipeMedia,
    ],
    logging: true,
    synchronize: true,
});

export default recipeDataSource;
