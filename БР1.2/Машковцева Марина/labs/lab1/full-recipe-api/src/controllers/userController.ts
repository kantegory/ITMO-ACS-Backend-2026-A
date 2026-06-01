import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../models/User";
import { Subscription } from "../models/Subscription";
import { SavedRecipe } from "../models/SavedRecipe";
import { Recipe } from "../models/Recipe";
import { Like } from "../models/Like";

export const getUser = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id as string);
        const user = await AppDataSource.getRepository(User).findOne({
            where: { id: userId },
            select: ["id", "username", "email", "avatar_url", "bio", "created_at"]
        });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Failed to get user", error });
    }
};

export const subscribe = async (req: Request, res: Response) => {
    try {
        const subscriberId = (req as any).userId;
        const authorId = parseInt(req.params.id as string);
        
        if (subscriberId === authorId) {
            return res.status(400).json({ message: "Cannot subscribe to yourself" });
        }
        
        const existing = await AppDataSource.getRepository(Subscription).findOne({
            where: { subscriber_id: subscriberId, author_id: authorId }
        });
        
        if (existing) {
            return res.status(400).json({ message: "Already subscribed" });
        }
        
        const subscription = AppDataSource.getRepository(Subscription).create({
            subscriber_id: subscriberId,
            author_id: authorId
        });
        
        await AppDataSource.getRepository(Subscription).save(subscription);
        res.status(201).json({ message: "Subscribed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to subscribe", error });
    }
};

export const unsubscribe = async (req: Request, res: Response) => {
    try {
        const subscriberId = (req as any).userId;
        const authorId = parseInt(req.params.id as string);
        
        await AppDataSource.getRepository(Subscription).delete({
            subscriber_id: subscriberId,
            author_id: authorId
        });
        
        res.json({ message: "Unsubscribed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to unsubscribe", error });
    }
};

export const getSubscriptions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const subscriptions = await AppDataSource.getRepository(Subscription).find({
            where: { subscriber_id: userId },
            relations: ["author"]
        });
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: "Failed to get subscriptions", error });
    }
};

export const saveRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        
        const existing = await AppDataSource.getRepository(SavedRecipe).findOne({
            where: { user_id: userId, recipe_id: recipeId }
        });
        
        if (existing) {
            return res.status(400).json({ message: "Already saved" });
        }
        
        const saved = AppDataSource.getRepository(SavedRecipe).create({
            user_id: userId,
            recipe_id: recipeId
        });
        
        await AppDataSource.getRepository(SavedRecipe).save(saved);
        res.status(201).json({ message: "Recipe saved" });
    } catch (error) {
        res.status(500).json({ message: "Failed to save recipe", error });
    }
};

export const unsaveRecipe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.id as string);
        
        await AppDataSource.getRepository(SavedRecipe).delete({
            user_id: userId,
            recipe_id: recipeId
        });
        
        res.json({ message: "Recipe unsaved" });
    } catch (error) {
        res.status(500).json({ message: "Failed to unsave recipe", error });
    }
};

export const getSavedRecipes = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const saved = await AppDataSource.getRepository(SavedRecipe).find({
            where: { user_id: userId },
            relations: ["recipe"]
        });
        res.json(saved.map(s => s.recipe));
    } catch (error) {
        res.status(500).json({ message: "Failed to get saved recipes", error });
    }
};

export const getUserRecipes = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id as string);
        
        const recipes = await AppDataSource.getRepository(Recipe)
            .createQueryBuilder("recipe")
            .leftJoin("recipe.likes", "like")
            .leftJoinAndSelect("recipe.author", "author")
            .addSelect("COUNT(DISTINCT like.id)", "likes_count")
            .where("recipe.author_id = :userId", { userId })
            .groupBy("recipe.id")
            .getRawAndEntities();
        
        const result = recipes.entities.map((entity, index) => ({
            ...entity,
            likes_count: parseInt(recipes.raw[index].likes_count)
        }));
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to get user recipes", error });
    }
};