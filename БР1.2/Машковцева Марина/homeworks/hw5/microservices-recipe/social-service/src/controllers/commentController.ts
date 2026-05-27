import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Comment } from "../models/Comment";
import { User } from "../models/User";

// Проверка существования пользователя
async function checkUserExists(userId: number): Promise<boolean> {
    try {
        const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
        return user !== null;
    } catch {
        return false;
    }
}

// Проверка существования рецепта
async function checkRecipeExists(recipeId: number): Promise<boolean> {
    try {
        const response = await fetch(`http://localhost:3002/internal/recipes/${recipeId}`);
        return response.ok;
    } catch {
        return false;
    }
}

// GET /comments/recipe/:recipeId - получить комментарии рецепта
export const getCommentsByRecipe = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const commentRepo = AppDataSource.getRepository(Comment);
        const comments = await commentRepo.find({
            where: { recipe_id: recipeId },
            order: { created_at: "DESC" }
        });
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get comments" });
    }
};

// POST /comments/recipe/:recipeId - добавить комментарий
export const addComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);
        const { text } = req.body;

        const userExists = await checkUserExists(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        const recipeExists = await checkRecipeExists(recipeId);
        if (!recipeExists) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        const commentRepo = AppDataSource.getRepository(Comment);
        const comment = commentRepo.create({
            text,
            user_id: userId,
            recipe_id: recipeId
        });
        await commentRepo.save(comment);
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

        const commentRepo = AppDataSource.getRepository(Comment);
        const comment = await commentRepo.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ message: "Not your comment" });
        }

        await commentRepo.delete(commentId);
        res.json({ message: "Comment deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete comment" });
    }
};
