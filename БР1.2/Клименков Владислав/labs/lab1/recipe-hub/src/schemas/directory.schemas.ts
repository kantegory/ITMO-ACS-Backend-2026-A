import { z } from 'zod'


// ========== DishType ==========


export const DishTypeReadSchema = z.object({
    id: z.number(),
    title: z.string(),
});
export type DishTypeReadType = z.infer<typeof DishTypeReadSchema>;


export const DishTypeReadListSchema = z.array(DishTypeReadSchema);
export type DishTypeReadListType = z.infer<typeof DishTypeReadListSchema>;


export const DishTypeCreateSchema = z.object({
    title: z.string(),
});
export type DishTypeCreateType = z.infer<typeof DishTypeCreateSchema>;


export const DishTypeUpdateSchema = z.object({
    title: z.string(),
});
export type DishTypeUpdateType = z.infer<typeof DishTypeUpdateSchema>;


// ========== Ingredient ==========


export const IngredientReadSchema = z.object({
    id: z.number(),
    title: z.string(),
});
export type IngredientReadType = z.infer<typeof IngredientReadSchema>;


export const IngredientReadListSchema = z.array(IngredientReadSchema);
export type IngredientReadListType = z.infer<typeof IngredientReadListSchema>;


export const IngredientCreateSchema = z.object({
    title: z.string(),
});
export type IngredientCreateType = z.infer<typeof IngredientCreateSchema>;


export const IngredientUpdateSchema = z.object({
    title: z.string(),
});
export type IngredientUpdateType = z.infer<typeof IngredientUpdateSchema>;
