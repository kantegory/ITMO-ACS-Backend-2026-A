import {
    IsString,
    IsInt,
    Min,
    IsArray,
    ValidateNested,
    IsEnum,
    IsOptional,
    IsUrl,
    IsUUID,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class RecipeStepDto {
    @IsInt()
    @Min(1)
    step_number: number;

    @IsString()
    instruction: string;

    @IsOptional()
    @IsUrl()
    image_url?: string;
}

class RecipeIngredientDto {
    @IsUUID('4')
    ingredient_id: string;

    @IsNumber()
    @Min(0.1)
    amount: number;

    @IsEnum(['g', 'ml', 'pcs', 'tbsp', 'tsp'])
    unit: string;
}

export class CreateRecipeDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(['easy', 'medium', 'hard'])
    difficulty: string;

    @IsInt()
    @Min(1)
    cooking_time_minutes: number;

    @IsOptional()
    @IsUrl()
    image_url?: string;

    @IsOptional()
    @IsUrl()
    video_url?: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    dish_type_ids?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeStepDto)
    steps?: RecipeStepDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientDto)
    ingredients?: RecipeIngredientDto[];
}
