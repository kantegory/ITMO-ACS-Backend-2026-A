import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware.js';
import { CommentService } from '../services/comment.service.js';


export const isCorrectCommentId = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const { recipeId: recipeIdStr, commentId: commentIdStr } = req.params;
    const recipeId = parseInt(recipeIdStr as string);
    const commentId = parseInt(commentIdStr as string);
    const isValid = await CommentService.isCorrectCommentId(commentId, recipeId);
    if (!isValid) {
        res.status(400).json({
            message: "Данный комментарий не принадлежит данному рецепту"
        });
        return;
    }
    next();
};
