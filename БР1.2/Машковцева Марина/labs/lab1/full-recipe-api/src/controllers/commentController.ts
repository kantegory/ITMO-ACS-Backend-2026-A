import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Comment } from "../models/Comment";

export const getComments = async (req: Request, res: Response) => {
    try {
        const recipeId = parseInt(req.params.recipeId as string);
        const comments = await AppDataSource.getRepository(Comment).find({
            where: { recipe_id: recipeId },
            relations: ["user"],
            order: { created_at: "DESC" }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: "Failed to get comments", error });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const recipeId = parseInt(req.params.recipeId as string);
        const { text } = req.body;
        
        const comment = AppDataSource.getRepository(Comment).create({
            text,
            user_id: userId,
            recipe_id: recipeId
        });
        
        await AppDataSource.getRepository(Comment).save(comment);
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: "Failed to create comment", error });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const commentId = parseInt(req.params.commentId as string);
        
        const comment = await AppDataSource.getRepository(Comment).findOne({ where: { id: commentId } });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }
        if (comment.user_id !== userId) {
            return res.status(403).json({ message: "Not your comment" });
        }
        
        await AppDataSource.getRepository(Comment).delete(commentId);
        res.json({ message: "Comment deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete comment", error });
    }
};