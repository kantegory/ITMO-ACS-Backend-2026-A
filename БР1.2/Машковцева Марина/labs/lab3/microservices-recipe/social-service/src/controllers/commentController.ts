import { Request, Response } from "express";
import axios from "axios";
import { AppDataSource } from "../data-source";
import { Comment } from "../models/Comment";
import { User } from "../models/User";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || 'http://localhost:3002';

async function checkUserExists(userId: number): Promise<boolean> {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOneBy({ id: userId });
        return user !== null;
    } catch {
        return false;
    }
}

async function checkRecipeExists(recipeId: number): Promise<boolean> {
    try {
        const response = await axios.get(`${RECIPE_SERVICE_URL}/internal/recipes/${recipeId}`);
        return response.status === 200;
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