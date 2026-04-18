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
import authMiddleware from '../middlewares/auth.middleware';
import { Recipe } from '../models/recipe.entity';
import { RecipeStep } from '../models/recipe-step.entity';
import { RecipeIngredient } from '../models/recipe-ingredient.entity';
import { RecipeDishType } from '../models/recipe-dish-type.entity';
import { Like } from '../models/like.entity';
import { SavedRecipe } from '../models/saved-recipe.entity';
import { Comment } from '../models/comment.entity';
import { CreateRecipeDto } from '../dto/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/update-recipe.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { Request } from 'express';

@JsonController('/recipes')
export class RecipeController {
    private recipeRepo = dataSource.getRepository(Recipe);
    private likeRepo = dataSource.getRepository(Like);
    private savedRepo = dataSource.getRepository(SavedRecipe);
    private commentRepo = dataSource.getRepository(Comment);

    @Get('/')
    async getAllRecipes(
        @QueryParam('difficulty') difficulty: string,
        @QueryParam('search') search: string,
        @QueryParam('dish_type_id') dishTypeId: string,
        @QueryParam('author_id') authorId: string,
        @QueryParam('limit') limit: number = 20,
        @QueryParam('offset') offset: number = 0,
    ) {
        const qb = this.recipeRepo
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.author', 'author')
            .leftJoinAndSelect('recipe.dish_types', 'recipe_dish_types')
            .leftJoinAndSelect('recipe_dish_types.dish_type', 'dish_type')
            .leftJoinAndSelect('recipe.ingredients', 'recipe_ingredients')
            .leftJoinAndSelect('recipe_ingredients.ingredient', 'ingredient')
            .leftJoinAndSelect('recipe.steps', 'steps')
            .take(limit)
            .skip(offset);

        if (difficulty)
            qb.andWhere('recipe.difficulty = :difficulty', { difficulty });
        if (authorId) qb.andWhere('author.id = :authorId', { authorId });
        if (dishTypeId)
            qb.andWhere('dish_type.id = :dishTypeId', { dishTypeId });
        if (search) {
            qb.andWhere(
                '(recipe.title ILIKE :search OR recipe.description ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        return await qb.getMany();
    }

    @Post('/')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async createRecipe(@Body() body: CreateRecipeDto, @Req() req: Request) {
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const authorId = (req as any).user?.id;
            const recipe = queryRunner.manager.create(Recipe, {
                title: body.title,
                description: body.description,
                difficulty: body.difficulty,
                cooking_time_minutes: body.cooking_time_minutes,
                image_url: body.image_url,
                video_url: body.video_url,
                author: { id: authorId },
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
                relations: ['author', 'steps', 'ingredients', 'dish_types'],
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
            relations: [
                'author',
                'steps',
                'ingredients',
                'ingredients.ingredient',
                'dish_types',
                'dish_types.dish_type',
            ],
        });
        if (!recipe) throw new HttpError(404, 'Рецепт не найден');
        return recipe;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    async updateRecipe(
        @Param('id') id: string,
        @Body() body: UpdateRecipeDto,
        @Req() req: Request,
    ) {
        const recipe = await this.recipeRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!recipe) throw new HttpError(404, 'Рецепт не найден');
        if (recipe.author.id !== (req as any).user.id)
            throw new HttpError(403, 'Вы не автор этого рецепта');

        Object.assign(recipe, body);
        return await this.recipeRepo.save(recipe);
    }

    @Delete('/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    async deleteRecipe(@Param('id') id: string, @Req() req: Request) {
        const recipe = await this.recipeRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!recipe) throw new HttpError(404, 'Рецепт не найден');
        if (recipe.author.id !== (req as any).user.id)
            throw new HttpError(403, 'Вы не автор этого рецепта');
        await this.recipeRepo.softDelete(id);
        return null;
    }

    @Post('/:id/like')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async likeRecipe(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user.id;
        const existingLike = await this.likeRepo.findOneBy({
            user: { id: userId },
            recipe: { id },
        });
        if (!existingLike)
            await this.likeRepo.save(
                this.likeRepo.create({ user: { id: userId }, recipe: { id } }),
            );
        return { message: 'Лайк поставлен' };
    }

    @Delete('/:id/like')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    async unlikeRecipe(@Param('id') id: string, @Req() req: Request) {
        await this.likeRepo.delete({
            user: { id: (req as any).user.id },
            recipe: { id },
        });
        return null;
    }

    @Post('/:id/save')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async saveRecipe(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user.id;
        const existingSave = await this.savedRepo.findOneBy({
            user: { id: userId },
            recipe: { id },
        });
        if (!existingSave)
            await this.savedRepo.save(
                this.savedRepo.create({ user: { id: userId }, recipe: { id } }),
            );
        return { message: 'Рецепт сохранен' };
    }

    @Delete('/:id/save')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    async unsaveRecipe(@Param('id') id: string, @Req() req: Request) {
        await this.savedRepo.delete({
            user: { id: (req as any).user.id },
            recipe: { id },
        });
        return null;
    }

    @Get('/:id/comments')
    async getComments(
        @Param('id') id: string,
        @QueryParam('limit') limit: number = 20,
        @QueryParam('offset') offset: number = 0,
    ) {
        return await this.commentRepo.find({
            where: { recipe: { id } },
            relations: ['author'],
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    @Post('/:id/comments')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async createComment(
        @Param('id') id: string,
        @Body() body: CreateCommentDto,
        @Req() req: Request,
    ) {
        const comment = this.commentRepo.create({
            content: body.content,
            author: { id: (req as any).user.id },
            recipe: { id },
        });
        return await this.commentRepo.save(comment);
    }
}
