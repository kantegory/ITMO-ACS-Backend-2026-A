import { prisma } from "../config/database.js";
import type { DishTypeCreateType, DishTypeUpdateType, IngredientCreateType, IngredientUpdateType } from "../schemas/directory.schemas.js";

export class DirectoryService {
    static async getDishTypes(search: string, page: number, limit: number) {
        const whereCondition: any = {};
        if (search.trim().length > 0) {
            whereCondition.title = {
                contains: search.trim(),
                mode: 'insensitive'
            };
        };
        const skip = (page - 1) * limit;
        const dishTypes = await prisma.dishType.findMany({
            skip: skip,
            take: limit,
            where: whereCondition
        });
        return dishTypes;
    };

    static async createDishType(dishTypeCreateData: DishTypeCreateType) {
        const { title } = dishTypeCreateData;
        const existingDishType = await prisma.dishType.findUnique({
            where: { title },
        });
        if (existingDishType) {
            throw new Error('Тип блюда с таким названием уже существует');
        };
        const dishType = await prisma.dishType.create({
            data: {
                title
            }
        });
        return dishType;
    };

    static async getDishType(dishTypeId: number) {
        const dishType = await prisma.dishType.findUnique({
            where: { id: dishTypeId }
        });
        if (!dishType) {
            throw new Error('Тип блюда не найден');
        };
        return dishType;
    };

    static async updateDishType(dishTypeId: number, dishTypeUpdateData: DishTypeUpdateType) {
        const dishType = await prisma.dishType.findUnique({
            where: { id: dishTypeId }
        });
        if (!dishType) {
            throw new Error('Тип блюда не найден');
        };
        const { title } = dishTypeUpdateData;
        const updatedDishType = await prisma.dishType.update({
            where: { id: dishTypeId },
            data: { title }
        })
        return updatedDishType;
    };

    static async deleteDishType(dishTypeId: number) {
        const dishType = await prisma.dishType.findUnique({
            where: { id: dishTypeId }
        });
        if (!dishType) {
            throw new Error('Тип блюда не найден');
        };
        await prisma.dishType.delete({
            where: { id: dishTypeId }
        });
    };

    static async getIngredients(search: string, page: number, limit: number) {
        const whereCondition: any = {};
        if (search.trim().length > 0) {
            whereCondition.title = {
                contains: search.trim(),
                mode: 'insensitive'
            };
        };
        const skip = (page - 1) * limit;
        const ingredients = await prisma.ingredient.findMany({
            skip: skip,
            take: limit,
            where: whereCondition
        });
        return ingredients;
    };

    static async createIngredient(ingredientCreateData: IngredientCreateType) {
        const { title } = ingredientCreateData;
        const existingIngredient = await prisma.ingredient.findUnique({
            where: { title },
        });
        if (existingIngredient) {
            throw new Error('Тип блюда с таким названием уже существует');
        };
        const ingredient = await prisma.ingredient.create({
            data: {
                title
            }
        });
        return ingredient;
    };

    static async getIngredient(ingredientId: number) {
        const ingredient = await prisma.ingredient.findUnique({
            where: { id: ingredientId }
        });
        if (!ingredient) {
            throw new Error('Тип блюда не найден');
        };
        return ingredient;
    };

    static async updateIngredient(ingredientId: number, ingredientUpdateData: IngredientUpdateType) {
        const ingredient = await prisma.ingredient.findUnique({
            where: { id: ingredientId }
        });
        if (!ingredient) {
            throw new Error('Тип блюда не найден');
        };
        const { title } = ingredientUpdateData;
        const updatedIngredient = await prisma.ingredient.update({
            where: { id: ingredientId },
            data: { title }
        })
        return updatedIngredient;
    };

    static async deleteIngredient(ingredientId: number) {
        const ingredient = await prisma.ingredient.findUnique({
            where: { id: ingredientId }
        });
        if (!ingredient) {
            throw new Error('Тип блюда не найден');
        };
        await prisma.ingredient.delete({
            where: { id: ingredientId }
        });
    };
}
