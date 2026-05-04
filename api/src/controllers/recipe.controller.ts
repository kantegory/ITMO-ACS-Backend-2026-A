import {
    Body,
    Delete,
    Get,
    Patch,
    Post,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Recipe, Difficulty } from '../models/recipe.entity';
import { User } from '../models/user.entity';

class RecipeCreateDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(Difficulty)
    difficulty: Difficulty;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    cookingTime?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    servings?: number;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsOptional()
    @IsString()
    videoUrl?: string;

    @IsNumber()
    @Type(() => Number)
    authorId: number;
}

class RecipeUpdateDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(Difficulty)
    difficulty?: Difficulty;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    cookingTime?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    servings?: number;

    @IsOptional()
    @IsString()
    photoUrl?: string;

    @IsOptional()
    @IsString()
    videoUrl?: string;
}

@EntityController({
    baseRoute: '/recipes',
    entity: Recipe,
})
class RecipeController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Get recipes list' })
    async getRecipes(
        @QueryParam('query', { required: false, type: String }) query?: string,
        @QueryParam('difficulty', { required: false, type: String }) difficulty?: Difficulty,
    ) {
        const qb = this.repository
            .createQueryBuilder('recipe')
            .leftJoinAndSelect('recipe.author', 'author')
            .leftJoinAndSelect('recipe.ingredients', 'ingredients')
            .leftJoinAndSelect('recipe.dishTypes', 'dishTypes');

        if (query) {
            qb.andWhere('LOWER(recipe.title) LIKE LOWER(:query)', {
                query: `%${query}%`,
            });
        }

        if (difficulty) {
            qb.andWhere('recipe.difficulty = :difficulty', { difficulty });
        }

        return qb.getMany();
    }

    @Get('/details')
    @OpenAPI({ summary: 'Get recipe by id' })
    async getRecipeById(
        @QueryParam('id', { required: true, type: Number }) id: number,
    ) {
        const recipe = await this.repository.findOne({
            where: { id },
            relations: {
                author: true,
                ingredients: true,
                dishTypes: true,
                steps: true,
                comments: {
                    user: true,
                },
                likes: true,
            },
        });

        if (!recipe) {
            return { message: 'Recipe is not found' };
        }

        return recipe;
    }

    @Post('/')
    @OpenAPI({ summary: 'Create recipe' })
    async createRecipe(@Body({ type: RecipeCreateDto }) data: RecipeCreateDto) {
        const author = await User.findOneBy({ id: data.authorId });

        if (!author) {
            return { message: 'Author is not found' };
        }

        const recipe = this.repository.create({
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            cookingTime: data.cookingTime,
            servings: data.servings,
            photoUrl: data.photoUrl,
            videoUrl: data.videoUrl,
            author,
        });

        return this.repository.save(recipe);
    }

    @Patch('/')
    @OpenAPI({ summary: 'Update recipe' })
    async updateRecipe(
        @QueryParam('id', { required: true, type: Number }) id: number,
        @Body({ type: RecipeUpdateDto }) data: RecipeUpdateDto,
    ) {
        const recipe = await this.repository.findOneBy({ id });

        if (!recipe) {
            return { message: 'Recipe is not found' };
        }

        this.repository.merge(recipe, data);

        return this.repository.save(recipe);
    }

    @Delete('/')
    @OpenAPI({ summary: 'Delete recipe' })
    async deleteRecipe(
        @QueryParam('id', { required: true, type: Number }) id: number,
    ) {
        const recipe = await this.repository.findOneBy({ id });

        if (!recipe) {
            return { message: 'Recipe is not found' };
        }

        await this.repository.remove(recipe);

        return { message: 'Recipe deleted' };
    }
}

export default RecipeController;
