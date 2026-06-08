import {
    JsonController,
    Get,
    Delete,
    Param,
    HttpCode,
    HttpError,
} from "routing-controllers";
import dataSource from "../config/data-source";
import { Recipe } from "../models/recipe.entity";

@JsonController("/internal/recipes")
export class InternalRecipeController {
    private recipeRepo = dataSource.getRepository(Recipe);

    // Этот эндпоинт будет дергать Social Service, когда кто-то ставит лайк
    @Get("/:id/exists")
    @HttpCode(200)
    async checkRecipeExists(@Param("id") id: string) {
        const recipe = await this.recipeRepo.findOneBy({ id });
        if (!recipe) throw new HttpError(404, "Рецепт не найден");

        return {
            exists: true,
            recipeId: recipe.id,
            authorId: recipe.author_id,
        };
    }

    // Этот эндпоинт будет дергать Identity Service при бане пользователя
    @Delete("/by-author/:userId")
    @HttpCode(204)
    async deleteRecipesByAuthor(@Param("userId") userId: string) {
        // Находим все рецепты автора и применяем к ним Soft Delete
        const recipes = await this.recipeRepo.find({
            where: { author_id: userId },
        });
        if (recipes.length > 0) {
            await this.recipeRepo.softRemove(recipes);
        }
        return null;
    }
}
