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
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateRecipeStepDto {
    @IsOptional()
    @IsUUID('4')
    id?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    step_number?: number;

    @IsOptional()
    @IsString()
    instruction?: string;

    @IsOptional()
    @IsUrl()
    image_url?: string;
}

export class UpdateRecipeDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(['easy', 'medium', 'hard'])
    difficulty?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    cooking_time_minutes?: number;

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
    @Type(() => UpdateRecipeStepDto)
    steps?: UpdateRecipeStepDto[];
}
