import {
    JsonController,
    Delete,
    Param,
    UseBefore,
    HttpCode,
    HttpError,
} from "routing-controllers";
import dataSource from "../config/data-source";
import { BlogPost } from "../models/blog-post.entity";
import { Comment } from "../models/comment.entity";
import { roleMiddleware } from "../middlewares/role.middleware";
import { extractUserMiddleware } from "../middlewares/extract-user.middleware";

@JsonController("/admin")
@UseBefore(extractUserMiddleware)
export class AdminController {
    private blogRepo = dataSource.getRepository(BlogPost);
    private commentRepo = dataSource.getRepository(Comment);

    @Delete("/blogs/:id")
    @HttpCode(204)
    @UseBefore(roleMiddleware(["admin", "moderator"]))
    async deleteBlogPost(@Param("id") id: string) {
        const result = await this.blogRepo.softDelete(id);
        if (result.affected === 0) throw new HttpError(404, "Пост не найден");
        return null;
    }

    @Delete("/comments/:id")
    @HttpCode(204)
    @UseBefore(roleMiddleware(["admin", "moderator"]))
    async deleteComment(@Param("id") id: string) {
        const result = await this.commentRepo.softDelete(id);
        if (result.affected === 0)
            throw new HttpError(404, "Комментарий не найден");
        return null;
    }
}
