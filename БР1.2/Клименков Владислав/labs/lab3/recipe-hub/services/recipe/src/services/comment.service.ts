import { prisma } from "../config/database.js";
import type { CommentCreateType, CommentUpdateType } from "../schemas/comment.schemas.js";
import { getUser } from "./userServiceClient.js";


export class CommentService {
    static async isUserCommentAuthor(userId: number, commentId: number) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { userId: true }
        });
        return comment?.userId === userId;
    };

    static async isCorrectCommentId(commentId: number, recipeId: number) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { recipeId: true }
        });
        return comment?.recipeId === recipeId;
    };

    static async getComments(recipeId: number, page: number, limit: number) {
        const skip = (page - 1) * limit;
        const comments = await prisma.comment.findMany({
            where: { recipeId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        // Получаем данные пользователей из user-service
        const userIds = [...new Set(comments.map(c => c.userId))];
        const users = await Promise.all(
            userIds.map(id => getUser(id).catch(() => null))
        );
        const userMap = new Map(users.filter(u => u).map(u => [u!.id, u]));

        return comments.map(comment => ({
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: userMap.get(comment.userId)
        }));
    };

    static async createComment(recipeId: number, userId: number, commentCreateData: CommentCreateType) {
        const recipe = await prisma.recipe.findUnique({
            where: { id: recipeId }
        });
        if (!recipe) {
            throw new Error('Рецепт не найден');
        }

        const comment = await prisma.comment.create({
            data: {
                text: commentCreateData.text,
                recipeId,
                userId
            },
        });

        const user = await getUser(userId);

        return {
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user
        };
    }

    static async getComment(commentId: number) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new Error('Комментарий не найден');
        }

        const user = await getUser(comment.userId);

        return {
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user
        };
    };

    static async updateComment(commentId: number, commentUpdateData: CommentUpdateType) {
        const existing = await prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!existing) {
            throw new Error('Комментарий не найден');
        }

        const updated = await prisma.comment.update({
            where: { id: commentId },
            data: { text: commentUpdateData.text },
        });

        const user = await getUser(updated.userId);

        return {
            id: updated.id,
            text: updated.text,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            user
        };
    };

    static async deleteComment(commentId: number) {
        const existing = await prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!existing) {
            throw new Error('Комментарий не найден');
        }
        await prisma.comment.delete({ where: { id: commentId } });
    };

    static async isCommentLiked(commentId: number, userId: number) {
        const like = await prisma.commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId
                }
            }
        });
        return { isLiked: !!like };
    };

    static async likeComment(commentId: number, userId: number): Promise<void> {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!comment) {
            throw new Error('Комментарий не найден');
        }

        try {
            await prisma.commentLike.create({
                data: {
                    userId,
                    commentId
                }
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                return;
            }
            throw error;
        }
    }

    static async unlikeComment(commentId: number, userId: number): Promise<void> {
        try {
            await prisma.commentLike.delete({
                where: {
                    userId_commentId: {
                        userId,
                        commentId
                    }
                }
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                return;
            }
            throw error;
        }
    }
};