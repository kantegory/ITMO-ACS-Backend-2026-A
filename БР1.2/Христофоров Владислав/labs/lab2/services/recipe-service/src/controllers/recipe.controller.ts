import {
    JsonController,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    QueryParam,
    HttpError,
    Req,
    UseBefore,
    HttpCode,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import { extractUserMiddleware } from '../middlewares/extract-user.middleware';
import { Recipe } from '../models/recipe.entity';
import { RecipeStep } from '../models/recipe-step.entity';
import { RecipeIngredient } from '../models/recipe-ingredient.entity';
import { RecipeDishType } from '../models/recipe-dish-type.entity';
import { SavedRecipe } from '../models/saved-recipe.entity';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/update-recipe.dto';
import { Request } from 'express';

@JsonController('/recipes')
export class RecipeController {
    private recipeRepo = dataSource.getRepository(Recipe);
    private savedRepo = dataSource.getRepository(SavedRecipe);

    @Get('/')
    async getAllRecipes(
        @QueryParam('difficulty') difficulty: string,
        @QueryParam('search') search: string,
        @QueryParam('dish_type_id') dishTypeId: string,
        @QueryParam('author_id') authorId: string,
        @QueryParam('ingredients', { isArray: true }) ingredients: string[],
        @QueryParam('limit') limit: number = 20,
        @QueryParam('offset') offset: number = 0,
    ) {
        const qb = this.recipeRepo
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.dish_types', 'recipe_dish_types')
            .leftJoinAndSelect('recipe_dish_types.dish_type', 'dish_type')
            .leftJoinAndSelect('recipe.ingredients', 'recipe_ingredients')
            .leftJoinAndSelect('recipe_ingredients.ingredient', 'ingredient')
            .leftJoinAndSelect('recipe.steps', 'steps')
            .take(limit)
            .skip(offset);

        if (difficulty)
            qb.andWhere('recipe.difficulty = :difficulty', { difficulty });
        if (authorId) qb.andWhere('recipe.author_id = :authorId', { authorId });

        if (dishTypeId) {
            qb.andWhere((subQb) => {
                const sq = subQb
                    .subQuery()
                    .select('rdt.recipe_id')
                    .from(RecipeDishType, 'rdt')
                    .where('rdt.dish_type_id = :dishTypeId')
                    .getQuery();
                return `recipe.id IN ${sq}`;
            }).setParameter('dishTypeId', dishTypeId);
        }

        if (search) {
            qb.andWhere(
                '(recipe.title ILIKE :search OR recipe.description ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        if (ingredients && ingredients.length > 0) {
            const ingArray = Array.isArray(ingredients)
                ? ingredients
                : [ingredients];
            qb.andWhere((subQb) => {
                const sq = subQb
                    .subQuery()
                    .select('ri.recipe_id')
                    .from(RecipeIngredient, 'ri')
                    .where('ri.ingredient_id IN (:...ingArray)')
                    .getQuery();
                return `recipe.id IN ${sq}`;
            }).setParameter('ingArray', ingArray);
        }

        return await qb.getMany();
    }

    @Post('/')
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async createRecipe(@Body() body: CreateRecipeDto, @Req() req: Request) {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const authorId = (req as any).user?.id;
            if (!authorId) throw new HttpError(401, 'Не авторизован');

            const recipe = queryRunner.manager.create(Recipe, {
                title: body.title,
                description: body.description,
                difficulty: body.difficulty,
                cooking_time_minutes: body.cooking_time_minutes,
                image_url: body.image_url,
                video_url: body.video_url,
                author_id: authorId,
            });
            const savedRecipe = await queryRunner.manager.save(recipe);

            if (body.steps?.length) {
                await queryRunner.manager.save(
                    body.steps.map((step) =>
                        queryRunner.manager.create(RecipeStep, {
                            ...step,
                            recipe: { id: savedRecipe.id },
                        }),
                    ),
                );
            }
            if (body.ingredients?.length) {
                await queryRunner.manager.save(
                    body.ingredients.map((ing) =>
                        queryRunner.manager.create(RecipeIngredient, {
                            ingredient: { id: ing.ingredient_id },
                            amount: ing.amount,
                            unit: ing.unit,
                            recipe: { id: savedRecipe.id },
                        }),
                    ),
                );
            }
            if (body.dish_type_ids?.length) {
                await queryRunner.manager.save(
                    body.dish_type_ids.map((id) =>
                        queryRunner.manager.create(RecipeDishType, {
                            dish_type: { id },
                            recipe: { id: savedRecipe.id },
                        }),
                    ),
                );
            }

            await queryRunner.commitTransaction();
            return await queryRunner.manager.findOne(Recipe, {
                where: { id: savedRecipe.id },
                relations: {
                    steps: true,
                    ingredients: true,
                    dish_types: true,
                },
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpError(400, 'Ошибка при создании рецепта');
        } finally {
            await queryRunner.release();
        }
    }

    @Get('/:id')
    async getById(@Param('id') id: string) {
        const recipe = await this.recipeRepo.findOne({
            where: { id },
            relations: {
                steps: true,
                ingredients: { ingredient: true },
                dish_types: { dish_type: true },
            },
        });
        if (!recipe) throw new HttpError(404, 'Рецепт не найден');
        return recipe;
    }

    @Patch('/:id')
    @UseBefore(extractUserMiddleware)
    async updateRecipe(
        @Param('id') id: string,
        @Body() body: UpdateRecipeDto,
        @Req() req: Request,
    ) {
        const recipe = await this.recipeRepo.findOne({ where: { id } });
        if (!recipe) throw new HttpError(404, 'Рецепт не найден');

        if (
            recipe.author_id !== (req as any).user?.id &&
            (req as any).user?.role !== 'admin'
        ) {
            throw new HttpError(403, 'Вы не автор этого рецепта');
        }

        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            if (body.title) recipe.title = body.title;
            if (body.description !== undefined)
                recipe.description = body.description;
            if (body.difficulty) recipe.difficulty = body.difficulty;
            if (body.cooking_time_minutes)
                recipe.cooking_time_minutes = body.cooking_time_minutes;
            if (body.image_url !== undefined) recipe.image_url = body.image_url;
            if (body.video_url !== undefined) recipe.video_url = body.video_url;

            await queryRunner.manager.save(recipe);

            if (body.dish_type_ids !== undefined) {
                await queryRunner.manager.delete(RecipeDishType, {
                    recipe: { id },
                });
                if (body.dish_type_ids.length > 0) {
                    const newDishTypes = body.dish_type_ids.map((dishId) =>
                        queryRunner.manager.create(RecipeDishType, {
                            dish_type: { id: dishId },
                            recipe: { id },
                        }),
                    );
                    await queryRunner.manager.save(newDishTypes);
                }
            }

            await queryRunner.commitTransaction();
            return await this.recipeRepo.findOne({
                where: { id },
                relations: {
                    dish_types: { dish_type: true },
                    steps: true,
                    ingredients: true,
                },
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new HttpError(400, 'Ошибка при обновлении рецепта');
        } finally {
            await queryRunner.release();
        }
    }

    @Delete('/:id')
    @HttpCode(204)
    @UseBefore(extractUserMiddleware)
    async deleteRecipe(@Param('id') id: string, @Req() req: Request) {
        const recipe = await this.recipeRepo.findOne({ where: { id } });
        if (!recipe) throw new HttpError(404, 'Рецепт не найден');

        if (
            recipe.author_id !== (req as any).user?.id &&
            (req as any).user?.role !== 'admin'
        ) {
            throw new HttpError(403, 'Вы не автор этого рецепта');
        }

        await this.recipeRepo.softDelete(id);
        return null;
    }

    @Post('/:id/save')
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async saveRecipe(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user?.id;
        if (!userId) throw new HttpError(401, 'Не авторизован');

        const existingSave = await this.savedRepo.findOneBy({
            user_id: userId,
            recipe: { id },
        });
        if (!existingSave) {
            await this.savedRepo.save(
                this.savedRepo.create({ user_id: userId, recipe: { id } }),
            );
        }
        return { message: 'Рецепт сохранен в закладки' };
    }

    @Delete('/:id/save')
    @HttpCode(204)
    @UseBefore(extractUserMiddleware)
    async unsaveRecipe(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user?.id;
        if (!userId) throw new HttpError(401, 'Не авторизован');

        await this.savedRepo.delete({ user_id: userId, recipe: { id } });
        return null;
    }
}
