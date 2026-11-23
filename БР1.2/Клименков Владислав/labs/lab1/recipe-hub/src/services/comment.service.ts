import { prisma } from "../config/database.js";
import type { CommentCreateType, CommentUpdateType } from "../schemas/comment.schemas.js";
import { UserReadSchema } from "../schemas/user.schemas.js";


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
            include: {
                user: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        return comments.map(comment => ({
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: UserReadSchema.parse(comment.user)
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
            include: {
                user: true
            }
        });

        return {
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: UserReadSchema.parse(comment.user)
        };
    }

    static async getComment(commentId: number) {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                user: true
            }
        });

        if (!comment) {
            throw new Error('Комментарий не найден');
        }

        return {
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            user: UserReadSchema.parse(comment.user)
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
            include: { user: true }
        });

        return {
            id: updated.id,
            text: updated.text,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
            user: UserReadSchema.parse(updated.user)
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
            // Если уникальность нарушена (лайк уже есть) — игнорируем или пробрасываем
            if (error.code === 'P2002') {
                // Не бросаем ошибку, просто ничего не делаем
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
            // Если записи не было — просто выходим
            if (error.code === 'P2025') {
                return;
            }
            throw error;
        }
    }
};
