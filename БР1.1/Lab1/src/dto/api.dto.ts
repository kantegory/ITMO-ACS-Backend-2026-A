import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';

import { RecipeMediaType } from '../models';

export class ErrorResponseDto {
    @IsString()
    code: string;

    @IsString()
    message: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    details?: string[];
}

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    size = 10;
}

export class RegisterRequestDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'username can only contain latin letters, numbers and underscore',
    })
    username: string;

    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;
}

export class LoginRequestDto {
    @IsString()
    username: string;

    @IsString()
    password: string;
}

export class UserProfileDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    bio: string | null;

    @IsOptional()
    @IsUrl()
    avatarUrl: string | null;

    @Type(() => Date)
    createdAt: Date;
}

export class AuthResponseDto {
    @IsString()
    accessToken: string;

    @IsString()
    tokenType: string;

    @Type(() => Number)
    @IsInt()
    expiresIn: number;

    @ValidateNested()
    @Type(() => UserProfileDto)
    user: UserProfileDto;
}

export class UpdateProfileRequestDto {
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    bio?: string | null;

    @IsOptional()
    @IsUrl()
    avatarUrl?: string | null;
}

export class ChangePasswordRequestDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    newPassword: string;
}

export class CategoryDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsString()
    name: string;
}

export class DifficultyLevelDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsString()
    name: string;
}

export class IngredientDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsString()
    name: string;
}

export class RecipeIngredientInputDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    ingredientId: number;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    quantity: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(32)
    unit: string;
}

export class RecipeStepInputDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    stepNumber: number;

    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    description: string;
}

export class RecipeMediaInputDto {
    @IsEnum(RecipeMediaType)
    mediaType: RecipeMediaType;

    @IsUrl()
    url: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    sortOrder: number;
}

export class CreateRecipeRequestDto {
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    title: string;

    @IsString()
    @MaxLength(5000)
    description: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    categoryId: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    difficultyId: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    cookingTimeMinutes: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    servings: number;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientInputDto)
    ingredients: RecipeIngredientInputDto[];

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => RecipeStepInputDto)
    steps: RecipeStepInputDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeMediaInputDto)
    media?: RecipeMediaInputDto[];
}

export class UpdateRecipeRequestDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    categoryId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    difficultyId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    cookingTimeMinutes?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    servings?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientInputDto)
    ingredients?: RecipeIngredientInputDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeStepInputDto)
    steps?: RecipeStepInputDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeMediaInputDto)
    media?: RecipeMediaInputDto[];
}

export enum RecipeSortBy {
    CREATED_AT = 'createdAt',
    COOKING_TIME_MINUTES = 'cookingTimeMinutes',
    TITLE = 'title',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class RecipeListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    q?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    categoryId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    difficultyId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    ingredientId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    authorId?: number;

    @IsOptional()
    @IsEnum(RecipeSortBy)
    sortBy: RecipeSortBy = RecipeSortBy.CREATED_AT;

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.DESC;
}

export class IngredientListQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    q?: string;
}

export class RecipeAuthorDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsString()
    username: string;

    @IsOptional()
    @IsUrl()
    avatarUrl: string | null;
}

export class RecipeIngredientDto {
    @ValidateNested()
    @Type(() => IngredientDto)
    ingredient: IngredientDto;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    quantity: number;

    @IsString()
    unit: string;
}

export class RecipeStepDto {
    @Type(() => Number)
    @IsInt()
    stepNumber: number;

    @IsString()
    description: string;
}

export class RecipeMediaDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsEnum(RecipeMediaType)
    mediaType: RecipeMediaType;

    @IsUrl()
    url: string;

    @Type(() => Number)
    @IsInt()
    sortOrder: number;
}

export class RecipeSummaryDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @Type(() => Number)
    @IsInt()
    cookingTimeMinutes: number;

    @Type(() => Number)
    @IsInt()
    servings: number;

    @ValidateNested()
    @Type(() => CategoryDto)
    category: CategoryDto;

    @ValidateNested()
    @Type(() => DifficultyLevelDto)
    difficulty: DifficultyLevelDto;

    @ValidateNested()
    @Type(() => RecipeAuthorDto)
    author: RecipeAuthorDto;

    @Type(() => Number)
    @IsInt()
    likesCount: number;

    @Type(() => Number)
    @IsInt()
    commentsCount: number;

    isLiked: boolean;

    isFavorite: boolean;

    @Type(() => Date)
    createdAt: Date;
}

export class RecipeDetailDto extends RecipeSummaryDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeIngredientDto)
    ingredients: RecipeIngredientDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeStepDto)
    steps: RecipeStepDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeMediaDto)
    media: RecipeMediaDto[];
}

export class CreateCommentRequestDto {
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    content: string;
}

export class CommentAuthorDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @IsString()
    username: string;

    @IsOptional()
    @IsUrl()
    avatarUrl: string | null;
}

export class CommentResponseDto {
    @Type(() => Number)
    @IsInt()
    id: number;

    @Type(() => Number)
    @IsInt()
    recipeId: number;

    @ValidateNested()
    @Type(() => CommentAuthorDto)
    author: CommentAuthorDto;

    @IsString()
    content: string;

    @Type(() => Date)
    createdAt: Date;
}

export class ReactionResponseDto {
    @Type(() => Number)
    @IsInt()
    recipeId: number;

    @Type(() => Number)
    @IsInt()
    userId: number;

    @Type(() => Date)
    createdAt: Date;
}

export class PaginatedRecipeListDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RecipeSummaryDto)
    items: RecipeSummaryDto[];

    @Type(() => Number)
    @IsInt()
    page: number;

    @Type(() => Number)
    @IsInt()
    size: number;

    @Type(() => Number)
    @IsInt()
    totalItems: number;

    @Type(() => Number)
    @IsInt()
    totalPages: number;
}

export class PaginatedCommentListDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CommentResponseDto)
    items: CommentResponseDto[];

    @Type(() => Number)
    @IsInt()
    page: number;

    @Type(() => Number)
    @IsInt()
    size: number;

    @Type(() => Number)
    @IsInt()
    totalItems: number;

    @Type(() => Number)
    @IsInt()
    totalPages: number;
}

export class PaginatedIngredientListDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    items: IngredientDto[];

    @Type(() => Number)
    @IsInt()
    page: number;

    @Type(() => Number)
    @IsInt()
    size: number;

    @Type(() => Number)
    @IsInt()
    totalItems: number;

    @Type(() => Number)
    @IsInt()
    totalPages: number;
}
