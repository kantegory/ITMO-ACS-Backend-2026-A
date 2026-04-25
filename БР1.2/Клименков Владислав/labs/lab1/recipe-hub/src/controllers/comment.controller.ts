import type { AuthRequest } from "../middlewares/auth.middleware.js";
import type { Response } from 'express'
import { CommentService } from "../services/comment.service.js";
import { 
    CommentReadListSchema, 
    CommentReadSchema, 
    IsCommentLikedReadSchema, 
    type CommentCreateType, 
    type CommentUpdateType 
} from "../schemas/comment.schemas.js";


export class CommentController {
    static async getComments(req: AuthRequest, res: Response) {
        try {
            const { 
                page:pageStr='1', 
                limit:limitStr='20'
            } = req.query;
            const page = parseInt(pageStr as string);
            const limit = parseInt(limitStr as string);
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const comments = await CommentService.getComments(recipeId, page, limit);
            res.status(200).json(CommentReadListSchema.parse(comments));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async addComment(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { recipeId:recipeIdStr } = req.params;
            const recipeId = parseInt(recipeIdStr as string);
            const commentCreateData: CommentCreateType = req.body;
            const comment = await CommentService.createComment(recipeId, currentUserId, commentCreateData);
            res.status(201).json(CommentReadSchema.parse(comment));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async getComment(req: AuthRequest, res: Response) {
        try {
            const { commentId:commentIdStr } = req.params;
            const commentId = parseInt(commentIdStr as string);
            const comment = await CommentService.getComment(commentId);
            res.status(200).json(CommentReadSchema.parse(comment));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async updateComment(req: AuthRequest, res: Response) {
        try {
            const { commentId:commentIdStr } = req.params;
            const commentId = parseInt(commentIdStr as string);
            const commentUpdateData: CommentUpdateType = req.body;
            const comment = await CommentService.updateComment(commentId, commentUpdateData);
            res.status(200).json(CommentReadSchema.parse(comment));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async deleteComment(req: AuthRequest, res: Response) {
        try {
            const { commentId:commentIdStr } = req.params;
            const commentId = parseInt(commentIdStr as string);
            await CommentService.deleteComment(commentId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async isCommentLiked(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { commentId:commentIdStr } = req.params;
            const commentId = parseInt(commentIdStr as string);
            const isCommentLiked = await CommentService.isCommentLiked(commentId, currentUserId);
            res.status(200).json(IsCommentLikedReadSchema.parse(isCommentLiked));
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async likeComment(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { commentId:commentIdStr } = req.params;
            const commentId = parseInt(commentIdStr as string);
            await CommentService.likeComment(commentId, currentUserId);
            res.status(200).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };

    static async unlikeComment(req: AuthRequest, res: Response) {
        try {
            const currentUserId = req.currentUserId!;
            const { commentId:commentIdStr } = req.params;
            const commentId = parseInt(commentIdStr as string);
            await CommentService.unlikeComment(commentId, currentUserId);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({
                message: error.message,
            });
        };
    };
};
