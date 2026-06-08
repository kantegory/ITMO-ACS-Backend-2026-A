import {
    JsonController,
    Patch,
    Delete,
    Param,
    Body,
    Req,
    UseBefore,
    HttpCode,
    HttpError,
} from "routing-controllers";
import dataSource from "../config/data-source";
import { Comment } from "../models/comment.entity";
import { extractUserMiddleware } from "../middlewares/extract-user.middleware";
import { Request } from "express";

@JsonController("/comments")
@UseBefore(extractUserMiddleware)
export class CommentController {
    private commentRepo = dataSource.getRepository(Comment);

    @Patch("/:id")
    async updateComment(
        @Param("id") id: string,
        @Body() body: { content: string },
        @Req() req: Request,
    ) {
        const comment = await this.commentRepo.findOneBy({ id });
        if (!comment) throw new HttpError(404, "Комментарий не найден");
        if (
            comment.user_id !== (req as any).user.id &&
            (req as any).user.role !== "admin"
        )
            throw new HttpError(403, "Нет прав");

        comment.content = body.content;
        return await this.commentRepo.save(comment);
    }

    @Delete("/:id")
    @HttpCode(204)
    async deleteComment(@Param("id") id: string, @Req() req: Request) {
        const comment = await this.commentRepo.findOneBy({ id });
        if (!comment) throw new HttpError(404, "Комментарий не найден");
        if (
            comment.user_id !== (req as any).user.id &&
            (req as any).user.role !== "admin"
        )
            throw new HttpError(403, "Нет прав");

        await this.commentRepo.softDelete(id);
        return null;
    }
}
