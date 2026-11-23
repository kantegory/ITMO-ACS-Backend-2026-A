import type { Response } from 'express'
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { RecipeService } from '../services/recipe.service.js';
import { 
    IsRecipeSavedReadSchema,
    RecipeRatingReadSchema,
    RecipeReadListSchema, 
    RecipeReadSchema, 
    type RecipeCreateType, 
    type RecipeRatingPutType, 
    type RecipeUpdateType,
} from '../schemas/recipe.schemas.js';
import type { Difficulty } from '@prisma/client';


export class RecipeController {
    private static parseQueryParams(req: AuthRequest) {
        const { 
            page:pageStr='1', 
            limit:limitStr='20',
            search="",
            dishTypeIds:dishTypeIdsStr="",
            ingredientIds:ingredientIdsStr="",
            difficulty="",
        } = req.query;
        const page = parseInt(pageStr as string);
        const limit = parseInt(limitStr as string);
        let dishTypeIds: Array<number>;
        if (dishTypeIdsStr === "") {
            dishTypeIds = [];
        } else {
            dishTypeIds = (dishTypeIdsStr as string)
                .split(',')
                .map(id => parseInt(id.trim()));
        };
        let ingredientIds: Array<number>;
        if (ingredientIdsStr === "") {
            ingredientIds = [];
        } else {
            ingredientIds = (ingredientIdsStr as string)
                .split(',')
                .map(id => parseInt(id.trim()));
        };
        return {
            page,
            limit,
            search,
            dishTypeIds,
            ingredientIds,
            difficulty
        };
    };

    static async getCurrentUserRecipes(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const {
                page,
                limit,
                search,
                dishTypeIds,
                ingredientIds,
                difficulty
            } = RecipeController.parseQueryParams(req);
            const recipes = await RecipeService.getUserRecipes(
                currentUserId,
                page,
                limit,
                search as string,
                dishTypeIds,
                ingredientIds,
                true,
                difficulty as Difficulty
            );
            res.status(200).json(RecipeReadListSchema.parse(recipes));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getCurrentUserSavedRecipes(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const {
                page,
                limit,
                search,
                dishTypeIds,
                ingredientIds,
                difficulty
            } = RecipeController.parseQueryParams(req);
            const recipes = await RecipeService.getUserSavedRecipes(
                currentUserId,
                page,
                limit,
                search as string,
                dishTypeIds,
                ingredientIds,
                difficulty as Difficulty,
            );
            res.status(200).json(RecipeReadListSchema.parse(recipes));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getUserRecipes(req: AuthRequest, res: Response) {
        try {
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            const {
                page,
                limit,
                search,
                dishTypeIds,
                ingredientIds,
                difficulty
            } = RecipeController.parseQueryParams(req);
            const recipes = await RecipeService.getUserRecipes(
                userId,
                page,
                limit,
                search as string,
                dishTypeIds,
                ingredientIds,
                false,
                difficulty as Difficulty
            );
            res.status(200).json(RecipeReadListSchema.parse(recipes));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getUserSavedRecipes(req: AuthRequest, res: Response) {
        try {
            const { userId:userIdStr } = req.params;
            const userId = parseInt(userIdStr as string);
            const {
                page,
                limit,
                search,
                dishTypeIds,
                ingredientIds,
                difficulty
            } = RecipeController.parseQueryParams(req);
            const recipes = await RecipeService.getUserSavedRecipes(
                userId,
                page,
                limit,
                search as string,
                dishTypeIds,
                ingredientIds,
                difficulty as Difficulty
            );
            res.status(200).json(RecipeReadListSchema.parse(recipes));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getRecipes(req: AuthRequest, res: Response) {
        try {
            const {
                page,
                limit,
                search,
                dishTypeIds,
                ingredientIds,
                difficulty
            } = RecipeController.parseQueryParams(req);
            const recipes = await RecipeService.getRecipes(
                page,
                limit,
                search as string,
                dishTypeIds,
                ingredientIds,
                difficulty as Difficulty
            );
            res.status(200).json(RecipeReadListSchema.parse(recipes));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async addRecipe(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const recipeCreateData: RecipeCreateType = req.body;
            const recipe = await RecipeService.addRecipe(currentUserId, recipeCreateData);
            res.status(201).json(RecipeReadSchema.parse(recipe));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getRecipe(req: AuthRequest, res: Response) {
        try {
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const recipe = await RecipeService.getRecipe(recipeId);
            res.status(200).json(RecipeReadSchema.parse(recipe));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async updateRecipe(req: AuthRequest, res: Response) {
        try {
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const recipeUpdateData: RecipeUpdateType = req.body;
            const recipe = await RecipeService.updateRecipe(recipeId, recipeUpdateData);
            res.status(200).json(RecipeReadSchema.parse(recipe));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteRecipe(req: AuthRequest, res: Response) {
        try {
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            await RecipeService.deleteRecipe(recipeId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getRecipeRating(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const recipeRating = await RecipeService.getRecipeRating(recipeId, currentUserId);
            res.status(200).json(RecipeRatingReadSchema.parse(recipeRating));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async putRecipeRating(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const recipeRatingPutData: RecipeRatingPutType = req.body;
            const recipeRating = await RecipeService.putRecipeRating(recipeId, recipeRatingPutData, currentUserId);
            res.status(200).json(RecipeRatingReadSchema.parse(recipeRating));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteRecipeRating(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            await RecipeService.deleteRecipeRating(recipeId, currentUserId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async isRecipeSaved(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const isRecipeSaved = await RecipeService.isRecipeSaved(recipeId, currentUserId);
            res.status(200).json(IsRecipeSavedReadSchema.parse(isRecipeSaved));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async saveRecipe(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            await RecipeService.saveRecipe(recipeId, currentUserId);
            res.status(200).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async unsaveRecipe(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            await RecipeService.unsaveRecipe(recipeId, currentUserId);
            res.status(200).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
}
