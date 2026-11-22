import SETTINGS from '../config/settings';

// рецепты и пользователи лежат в других сервисах (и других базах),
// поэтому существование проверяем запросом к их внутренним эндпоинтам

export const recipeExists = async (recipeId: number): Promise<boolean> => {
    const response = await fetch(
        `${SETTINGS.RECIPE_SERVICE_URL}/v1/internal/recipes/${recipeId}`,
        { headers: { 'X-Internal-Key': SETTINGS.INTERNAL_API_KEY } },
    );

    return response.status === 200;
};

export const userExists = async (userId: number): Promise<boolean> => {
    const response = await fetch(
        `${SETTINGS.USER_SERVICE_URL}/v1/internal/users/${userId}`,
        { headers: { 'X-Internal-Key': SETTINGS.INTERNAL_API_KEY } },
    );

    return response.status === 200;
};
