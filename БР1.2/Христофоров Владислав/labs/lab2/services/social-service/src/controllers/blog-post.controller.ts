import {
    JsonController,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    QueryParam,
    HttpError,
    Req,
    UseBefore,
    HttpCode,
} from "routing-controllers";
import axios from "axios";
import dataSource from "../config/data-source";
import { extractUserMiddleware } from "../middlewares/extract-user.middleware";
import { BlogPost } from "../models/blog-post.entity";
import { Like } from "../models/like.entity";
import { Comment } from "../models/comment.entity";
import { CreateBlogPostDto } from "../dto/create-blog-post.dto";
import { UpdateBlogPostDto } from "../dto/update-blog-post.dto";
import { CreateCommentDto } from "../dto/create-comment.dto";
import { Request } from "express";

@JsonController("/blogs")
export class BlogController {
    private blogRepo = dataSource.getRepository(BlogPost);
    private likeRepo = dataSource.getRepository(Like);
    private commentRepo = dataSource.getRepository(Comment);
    private identityUrl =
        process.env.IDENTITY_SERVICE_URL || "http://localhost:8001";

    // АГРЕГАЦИЯ АВТОРОВ
    private async populateAuthors(
        items: any[],
        authorIdField: string = "author_id",
    ) {
        const authorIds = [
            ...new Set(items.map((item) => item[authorIdField])),
        ];
        if (authorIds.length === 0) return items;

        try {
            const { data } = await axios.post(
                `${this.identityUrl}/internal/users/bulk`,
                { userIds: authorIds },
            );
            const usersMap = new Map(data.map((u: any) => [u.id, u]));
            return items.map((item) => ({
                ...item,
                author: usersMap.get(item[authorIdField]) || {
                    id: item[authorIdField],
                    username: "Unknown",
                },
            }));
        } catch (e) {
            return items.map((item) => ({
                ...item,
                author: { id: item[authorIdField], username: "Unknown" },
            }));
        }
    }

    // БЛОГИ (Посты)

    @Get("/")
    async getAll(
        @QueryParam("limit") limit: number = 20,
        @QueryParam("offset") offset: number = 0,
    ) {
        const posts = await this.blogRepo.find({
            take: limit,
            skip: offset,
            order: { created_at: "DESC" },
        });
        return await this.populateAuthors(posts, "author_id");
    }

    @Get("/:id")
    async getById(@Param("id") id: string) {
        const post = await this.blogRepo.findOne({
            where: { id },
            relations: { likes: true, comments: true },
        });
        if (!post) throw new HttpError(404, "Пост не найден");

        const [populatedPost] = await this.populateAuthors([post], "author_id");
        populatedPost.comments = await this.populateAuthors(
            populatedPost.comments,
            "user_id",
        );
        return populatedPost;
    }

    @Post("/")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async create(@Body() body: CreateBlogPostDto, @Req() req: Request) {
        const post = this.blogRepo.create({
            ...body,
            author_id: (req as any).user.id,
        });
        return await this.blogRepo.save(post);
    }

    @Patch("/:id")
    @UseBefore(extractUserMiddleware)
    async update(
        @Param("id") id: string,
        @Body() body: UpdateBlogPostDto,
        @Req() req: Request,
    ) {
        const post = await this.blogRepo.findOneBy({ id });
        if (!post) throw new HttpError(404, "Пост не найден");
        if (
            post.author_id !== (req as any).user.id &&
            (req as any).user.role !== "admin"
        ) {
            throw new HttpError(403, "Нет прав на редактирование");
        }

        Object.assign(post, body);
        return await this.blogRepo.save(post);
    }

    @Delete("/:id")
    @HttpCode(204)
    @UseBefore(extractUserMiddleware)
    async delete(@Param("id") id: string, @Req() req: Request) {
        const post = await this.blogRepo.findOneBy({ id });
        if (!post) throw new HttpError(404, "Пост не найден");
        if (
            post.author_id !== (req as any).user.id &&
            (req as any).user.role !== "admin"
        )
            throw new HttpError(403, "Нет прав");
        await this.blogRepo.softDelete(id);
        return null;
    }

    // ЛАЙКИ И КОММЕНТЫ (Для блогов)

    @Post("/:id/like")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async likeBlog(@Param("id") id: string, @Req() req: Request) {
        const post = await this.blogRepo.findOneBy({ id });
        if (!post) throw new HttpError(404, "Пост не найден");

        const userId = (req as any).user.id;
        const existing = await this.likeRepo.findOneBy({
            user_id: userId,
            blog_post: { id },
        });
        if (!existing)
            await this.likeRepo.save(
                this.likeRepo.create({ user_id: userId, blog_post: { id } }),
            );
        return { message: "Лайк поставлен" };
    }

    @Delete("/:id/like")
    @HttpCode(204)
    @UseBefore(extractUserMiddleware)
    async unlikeBlog(@Param("id") id: string, @Req() req: Request) {
        await this.likeRepo.delete({
            user_id: (req as any).user.id,
            blog_post: { id },
        });
        return null;
    }

    @Post("/:id/comments")
    @HttpCode(201)
    @UseBefore(extractUserMiddleware)
    async createComment(
        @Param("id") id: string,
        @Body() body: CreateCommentDto,
        @Req() req: Request,
    ) {
        const post = await this.blogRepo.findOneBy({ id });
        if (!post) throw new HttpError(404, "Пост не найден");

        const comment = this.commentRepo.create({
            content: body.content,
            user_id: (req as any).user.id,
            blog_post: { id },
        });
        return await this.commentRepo.save(comment);
    }
}
