import {
    Body,
    Delete,
    Get,
    Patch,
    Post,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { RecipeStep } from '../models/recipe-step.entity';
import { Recipe } from '../models/recipe.entity';

class RecipeStepCreateDto {
    @IsNumber()
    @Type(() => Number)
    stepNumber: number;

    @IsString()
    @Type(() => String)
    description: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    photoUrl?: string;

    @IsNumber()
    @Type(() => Number)
    recipeId: number;
}

class RecipeStepUpdateDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    stepNumber?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    description?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    photoUrl?: string;
}

@EntityController({
    baseRoute: '/recipe-steps',
    entity: RecipeStep,
})
class RecipeStepController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Get recipe steps list' })
    async getAll(@QueryParam('recipeId', { required: false, type: Number }) recipeId?: number) {
        if (recipeId) {
            return this.repository.find({
                where: { recipe: { id: recipeId } },
                relations: { recipe: true },
                order: { stepNumber: 'ASC' },
            });
        }

        return this.repository.find({
            relations: { recipe: true },
            order: { stepNumber: 'ASC' },
        });
    }

    @Get('/details')
    @OpenAPI({ summary: 'Get recipe step by id' })
    async getById(@QueryParam('id', { required: true, type: Number }) id: number) {
        const step = await this.repository.findOne({
            where: { id },
            relations: { recipe: true },
        });

        if (!step) {
            return { message: 'Recipe step is not found' };
        }

        return step;
    }

    @Post('/')
    @OpenAPI({ summary: 'Create recipe step' })
    async create(@Body({ type: RecipeStepCreateDto }) data: RecipeStepCreateDto) {
        const recipe = await Recipe.findOneBy({ id: data.recipeId });

        if (!recipe) {
            return { message: 'Recipe is not found' };
        }

        const step = this.repository.create({
            stepNumber: data.stepNumber,
            description: data.description,
            photoUrl: data.photoUrl,
            recipe,
        });

        return this.repository.save(step);
    }

    @Patch('/update')
    @OpenAPI({ summary: 'Update recipe step' })
    async update(
        @QueryParam('id', { required: true, type: Number }) id: number,
        @Body({ type: RecipeStepUpdateDto }) data: RecipeStepUpdateDto,
    ) {
        const step = await this.repository.findOneBy({ id });

        if (!step) {
            return { message: 'Recipe step is not found' };
        }

        this.repository.merge(step, data);
        return this.repository.save(step);
    }

    @Delete('/delete')
    @OpenAPI({ summary: 'Delete recipe step' })
    async delete(@QueryParam('id', { required: true, type: Number }) id: number) {
        const step = await this.repository.findOneBy({ id });

        if (!step) {
            return { message: 'Recipe step is not found' };
        }

        await this.repository.remove(step);
        return { message: 'Recipe step deleted' };
    }
}

export default RecipeStepController;
