import SETTINGS from '../config/settings';
import { callService } from './call-service';

// имена пользователей по id: { 1: "dima", 2: "anna" }
export const getUsernames = async (userIds: number[]) => {
    const usernames: { [userId: number]: string } = {};

    if (userIds.length === 0) {
        return usernames;
    }

    const result = await callService(
        'GET',
        `${SETTINGS.USER_SERVICE_URL}/v1/internal/users?ids=${userIds.join(',')}`,
    );

    for (const user of result.data) {
        usernames[user.id] = user.username;
    }

    return usernames;
};

// количество лайков по id рецептов: { 10: 3, 12: 0 }
export const getLikesCounts = async (recipeIds: number[]) => {
    if (recipeIds.length === 0) {
        return {};
    }

    const result = await callService(
        'GET',
        `${SETTINGS.SOCIAL_SERVICE_URL}/v1/internal/likes/count?recipe_ids=${recipeIds.join(',')}`,
    );

    return result.data;
};

// карточки рецептов для списков добавляем автора и количество лайков
export const addAuthorsAndLikes = async (recipes: any[]) => {
    const usernames = await getUsernames(
        recipes.map((recipe) => recipe.author_id),
    );
    const likesCounts = await getLikesCounts(
        recipes.map((recipe) => recipe.id),
    );

    return recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        dish_type: recipe.dish_type,
        difficulty: recipe.difficulty,
        cooking_time: recipe.cooking_time,
        image_url: recipe.image_url,
        author: {
            id: recipe.author_id,
            username: usernames[recipe.author_id],
        },
        likes_count: likesCounts[recipe.id] || 0,
    }));
};

// полный рецепт для страницы рецепта то же самое для одного рецепта
export const addAuthorAndLikes = async (recipe: any) => {
    const usernames = await getUsernames([recipe.author_id]);
    const likesCounts = await getLikesCounts([recipe.id]);

    return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        dish_type: recipe.dish_type,
        difficulty: recipe.difficulty,
        cooking_time: recipe.cooking_time,
        steps: recipe.steps,
        image_url: recipe.image_url,
        video_url: recipe.video_url,
        author: {
            id: recipe.author_id,
            username: usernames[recipe.author_id],
        },
        ingredients: recipe.ingredients,
        likes_count: likesCounts[recipe.id] || 0,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
    };
};
