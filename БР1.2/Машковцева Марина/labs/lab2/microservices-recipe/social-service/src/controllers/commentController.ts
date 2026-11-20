import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Comment } from "../models/Comment";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || "http://localhost:3002";

// Проверка существования пользователя
async function checkUserExists(userId: number): Promise<boolean> {
    try {
        await axios.get(`${USER_SERVICE_URL}/internal/users/${userId}`);
        return true;
    } catch {
        return false;
    }
}

// Проверка существования рецепта
async function checkRecipeExists(recipeId: number): Promise<boolean> {
    try {
        await axios.get(`${RECIPE_SERVICE_URL}/internal/recipes/${recipeId}`);
        return true;
    } catch {
        return false;
    }
}

// GET /comments/recipe/:recipeId - получить комментарии рецепта
export const getCommentsByRecipe = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const comments = await AppDataSource.getRepository(Comment).find({
            where: { recipe_id: recipeId },
            order: { created_at: "DESC" }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: "Failed to get comments" });
    }
};

// POST /comments/recipe/:recipeId - добавить комментарий
export const addComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);
        const { text } = req.body;

        // Проверяем существование пользователя и рецепта
        const userExists = await checkUserExists(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        const recipeExists = await checkRecipeExists(recipeId);
        if (!recipeExists) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        const comment = AppDataSource.getRepository(Comment).create({
            text,
            user_id: userId,
            recipe_id: recipeId
        });
        await AppDataSource.getRepository(Comment).save(comment);
        res.status(201).json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to add comment" });
    }
};

// DELETE /comments/:commentId - удалить комментарий
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const commentId = parseInt(req.params.commentId as string);

        const comment = await AppDataSource.getRepository(Comment).findOne({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ message: "Not your comment" });
        }

        await AppDataSource.getRepository(Comment).delete(commentId);
        res.json({ message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete comment" });
    }
};
