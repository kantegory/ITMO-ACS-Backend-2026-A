import SETTINGS from '../config/settings';
export async function recipeExists(recipeId: number): Promise<boolean> {
    try {
        const response = await fetch(`${SETTINGS.RECIPE_SERVICE_URL}/recipes/internal/${recipeId}`);
        if (!response.ok) return false;
        const data = await response.json();
        return !data.message;
    } catch { return false; }
}
