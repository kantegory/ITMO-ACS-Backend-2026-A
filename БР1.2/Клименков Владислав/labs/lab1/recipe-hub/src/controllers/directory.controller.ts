import type { AuthRequest } from "../middlewares/auth.middleware.js";
import type { Response } from 'express'
import { AuthService } from "../services/auth.service.js";
import { 
    DishTypeReadListSchema, 
    DishTypeReadSchema, 
    DishTypeUpdateSchema, 
    IngredientReadListSchema, 
    IngredientReadSchema, 
    IngredientUpdateSchema, 
    type DishTypeCreateType, 
    type DishTypeUpdateType, 
    type IngredientCreateType,
    type IngredientUpdateType
} from "../schemas/directory.schemas.js";
import { DirectoryService } from "../services/directory.service.js";


export class DirectoryController {
    static async getDishTypes(req: AuthRequest, res: Response) {
        try {
            const { 
                page:pageStr='1', 
                limit:limitStr='20',
                search='',
            } = req.query;
            const page = parseInt(pageStr as string);
            const limit = parseInt(limitStr as string);
            const dishTypes = await DirectoryService.getDishTypes(search as string, page, limit);
            res.status(200).json(DishTypeReadListSchema.parse(dishTypes));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async addDishType(req: AuthRequest, res: Response) {
        try {
            const dishTypeCreateData: DishTypeCreateType = req.body;
            const dishType = await DirectoryService.createDishType(dishTypeCreateData);
            res.status(201).json(DishTypeReadSchema.parse(dishType));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getDishType(req: AuthRequest, res: Response) {
        try {
            const { dishTypeId:dishTypeIdStr } = req.params;
            const dishTypeId = parseInt(dishTypeIdStr as string);
            const dishType = await DirectoryService.getDishType(dishTypeId);
            res.status(200).json(DishTypeReadSchema.parse(dishType))
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async updateDishType(req: AuthRequest, res: Response) {
        try {
            const { dishTypeId:dishTypeIdStr } = req.params;
            const dishTypeId = parseInt(dishTypeIdStr as string);
            const dishTypeUpdateData: DishTypeUpdateType = req.body;
            const dishType = await DirectoryService.updateDishType(dishTypeId, dishTypeUpdateData);
            res.status(200).json(DishTypeUpdateSchema.parse(dishType));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteDishType(req: AuthRequest, res: Response) {
        try {
            const { dishTypeId:dishTypeIdStr } = req.params;
            const dishTypeId = parseInt(dishTypeIdStr as string);
            await DirectoryService.deleteDishType(dishTypeId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getIngredients(req: AuthRequest, res: Response) {
        try {
            const { 
                page:pageStr='1', 
                limit:limitStr='20',
                search='',
            } = req.query;
            const page = parseInt(pageStr as string);
            const limit = parseInt(limitStr as string);
            const ingredients = await DirectoryService.getIngredients(search as string, page, limit);
            res.status(200).json(IngredientReadListSchema.parse(ingredients));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async addIngredient(req: AuthRequest, res: Response) {
        try {
            const ingredientCreateData: IngredientCreateType = req.body;
            const ingredient = await DirectoryService.createIngredient(ingredientCreateData);
            res.status(201).json(IngredientReadSchema.parse(ingredient));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getIngredient(req: AuthRequest, res: Response) {
        try {
            const { ingredientId:ingredientIdStr } = req.params;
            const ingredientId = parseInt(ingredientIdStr as string);
            const ingredient = await DirectoryService.getIngredient(ingredientId);
            res.status(200).json(IngredientReadSchema.parse(ingredient))
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async updateIngredient(req: AuthRequest, res: Response) {
        try {
            const { ingredientId:ingredientIdStr } = req.params;
            const ingredientId = parseInt(ingredientIdStr as string);
            const ingredientUpdateData: IngredientUpdateType = req.body;
            const ingredient = await DirectoryService.updateIngredient(ingredientId, ingredientUpdateData);
            res.status(200).json(IngredientUpdateSchema.parse(ingredient));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteIngredient(req: AuthRequest, res: Response) {
        try {
            const { ingredientId:ingredientIdStr } = req.params;
            const ingredientId = parseInt(ingredientIdStr as string);
            await DirectoryService.deleteIngredient(ingredientId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
}
