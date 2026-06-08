import { JsonController, Delete, Param, HttpCode } from "routing-controllers";
import dataSource from "../config/data-source";
import { BlogPost } from "../models/blog-post.entity";
import { Comment } from "../models/comment.entity";
import { Like } from "../models/like.entity";
import { Subscription } from "../models/subscription.entity";

@JsonController("/internal/social")
export class InternalSocialController {
    private blogRepo = dataSource.getRepository(BlogPost);
    private commentRepo = dataSource.getRepository(Comment);
    private likeRepo = dataSource.getRepository(Like);
    private subRepo = dataSource.getRepository(Subscription);

    @Delete("/by-user/:userId")
    @HttpCode(204)
    async deleteUserData(@Param("userId") userId: string) {
        await this.likeRepo.delete({ user_id: userId });
        await this.subRepo.delete({ follower_id: userId });
        await this.subRepo.delete({ following_id: userId });

        const blogs = await this.blogRepo.find({
            where: { author_id: userId },
        });
        if (blogs.length > 0) await this.blogRepo.softRemove(blogs);

        const comments = await this.commentRepo.find({
            where: { user_id: userId },
        });
        if (comments.length > 0) await this.commentRepo.softRemove(comments);

        return null;
    }
}
