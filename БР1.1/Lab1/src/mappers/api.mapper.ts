import {
    CategoryDto,
    CommentResponseDto,
    DifficultyLevelDto,
    IngredientDto,
    RecipeAuthorDto,
    RecipeDetailDto,
    RecipeIngredientDto,
    RecipeMediaDto,
    RecipeStepDto,
    RecipeSummaryDto,
    UserProfileDto,
} from '../dto/api.dto';
import { Comment, Recipe, RecipeIngredient, RecipeMedia, RecipeStep, User } from '../models';

type RecipeStats = {
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    isFavorite: boolean;
};

export const toUserProfileDto = (user: User): UserProfileDto => {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
    };
};

export const toRecipeAuthorDto = (user: User): RecipeAuthorDto => {
    return {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
    };
};

export const toCategoryDto = (id: number, name: string): CategoryDto => ({
    id,
    name,
});

export const toDifficultyLevelDto = (
    id: number,
    name: string,
): DifficultyLevelDto => ({
    id,
    name,
});

export const toIngredientDto = (id: number, name: string): IngredientDto => ({
    id,
    name,
});

const toRecipeIngredientDto = (
    recipeIngredient: RecipeIngredient,
): RecipeIngredientDto => {
    return {
        ingredient: toIngredientDto(
            recipeIngredient.ingredient.id,
            recipeIngredient.ingredient.name,
        ),
        quantity: Number(recipeIngredient.quantity),
        unit: recipeIngredient.unit,
    };
};

const toRecipeStepDto = (recipeStep: RecipeStep): RecipeStepDto => {
    return {
        stepNumber: recipeStep.stepNumber,
        description: recipeStep.description,
    };
};

const toRecipeMediaDto = (recipeMedia: RecipeMedia): RecipeMediaDto => {
    return {
        id: recipeMedia.id,
        mediaType: recipeMedia.mediaType,
        url: recipeMedia.url,
        sortOrder: recipeMedia.sortOrder,
    };
};

export const toRecipeSummaryDto = (
    recipe: Recipe,
    stats: RecipeStats,
): RecipeSummaryDto => {
    return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cookingTimeMinutes: recipe.cookingTimeMinutes,
        servings: recipe.servings,
        category: toCategoryDto(recipe.category.id, recipe.category.name),
        difficulty: toDifficultyLevelDto(
            recipe.difficulty.id,
            recipe.difficulty.name,
        ),
        author: toRecipeAuthorDto(recipe.author),
        likesCount: stats.likesCount,
        commentsCount: stats.commentsCount,
        isLiked: stats.isLiked,
        isFavorite: stats.isFavorite,
        createdAt: recipe.createdAt,
    };
};

export const toRecipeDetailDto = (
    recipe: Recipe,
    stats: RecipeStats,
): RecipeDetailDto => {
    return {
        ...toRecipeSummaryDto(recipe, stats),
        ingredients: (recipe.ingredients || []).map(toRecipeIngredientDto),
        steps: (recipe.steps || [])
            .slice()
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map(toRecipeStepDto),
        media: (recipe.media || [])
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(toRecipeMediaDto),
    };
};

export const toCommentResponseDto = (comment: Comment): CommentResponseDto => {
    return {
        id: comment.id,
        recipeId: comment.recipe.id,
        author: {
            id: comment.author.id,
            username: comment.author.username,
            avatarUrl: comment.author.avatarUrl,
        },
        content: comment.content,
        createdAt: comment.createdAt,
    };
};
