import {
    JsonController,
    Post,
    Delete,
    Get,
    Body,
    Param,
    HttpError,
    Req,
    UseBefore,
    HttpCode,
} from "routing-controllers";
import axios from "axios";
import dataSource from "../config/data-source";
import { extractUserMiddleware } from "../middlewares/extract-user.middleware";
import { Like } from "../models/like.entity";
import { Comment } from "../models/comment.entity";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { Request } from "express";

@JsonController("/recipes")
export class SocialRecipeController {
    private likeRepo = dataSource.getRepository(Like);
    private commentRepo = dataSource.getRepository(Comment);
    private recipeUrl =
        process.env.RECIPE_SERVICE_URL || "http://localhost:8002";
    private identityUrl =
        process.env.IDENTITY_SERVICE_URL || "http://localhost:8001";

    private async ensureRecipeExists(recipeId: string) {
        try {
            await axios.get(
                `${this.recipeUrl}/internal/recipes/${recipeId}/exists`,
            );
        } catch (error) {
            throw new HttpError(404, "Рецепт не найден");
        }
    }

    // ЛАЙКИ РЕЦЕПТОВ

    @Post("/:id/like")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async likeRecipe(@Param("id") id: string, @Req() req: Request) {
        await this.ensureRecipeExists(id);

        const userId = (req as any).user.id;
        const existing = await this.likeRepo.findOneBy({
            user_id: userId,
            recipe_id: id,
        });

        if (!existing)
            await this.likeRepo.save(
                this.likeRepo.create({ user_id: userId, recipe_id: id }),
            );
        return { message: "Лайк поставлен" };
    }

    @Delete("/:id/like")
    @HttpCode(204)
    @UseBefore(extractUserMiddleware)
    async unlikeRecipe(@Param("id") id: string, @Req() req: Request) {
        await this.likeRepo.delete({
            user_id: (req as any).user.id,
            recipe_id: id,
        });
        return null;
    }

    // КОММЕНТАРИИ РЕЦЕПТОВ

    @Get("/:id/comments")
    async getRecipeComments(@Param("id") id: string) {
        const comments = await this.commentRepo.find({
            where: { recipe_id: id },
            order: { created_at: "ASC" },
        });
        if (comments.length === 0) return [];

        const authorIds = [...new Set(comments.map((c) => c.user_id))];
        try {
            const { data } = await axios.post(
                `${this.identityUrl}/internal/users/bulk`,
                { userIds: authorIds },
            );
            const usersMap = new Map(data.map((u: any) => [u.id, u]));

            return comments.map((c) => ({
                ...c,
                author: usersMap.get(c.user_id) || {
                    id: c.user_id,
                    username: "Unknown",
                },
            }));
        } catch (e) {
            return comments;
        }
    }

    @Post("/:id/comments")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async createComment(
        @Param("id") id: string,
        @Body() body: CreateCommentDto,
        @Req() req: Request,
    ) {
        await this.ensureRecipeExists(id);

        const comment = this.commentRepo.create({
            content: body.content,
            user_id: (req as any).user.id,
            recipe_id: id,
        });
        return await this.commentRepo.save(comment);
    }
}
