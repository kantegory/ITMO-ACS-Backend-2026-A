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
} from 'routing-controllers';
import dataSource from '../config/data-source';
import authMiddleware from '../middlewares/auth.middleware';
import { BlogPost } from '../models/blog-post.entity';
import { Like } from '../models/like.entity';
import { Comment } from '../models/comment.entity';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { Request } from 'express';

@JsonController('/blogs')
export class BlogPostController {
    private blogRepo = dataSource.getRepository(BlogPost);
    private likeRepo = dataSource.getRepository(Like);
    private commentRepo = dataSource.getRepository(Comment);

    @Get('/')
    async getAll(
        @QueryParam('limit') limit: number = 20,
        @QueryParam('offset') offset: number = 0,
    ) {
        return await this.blogRepo.find({
            take: limit,
            skip: offset,
            relations: ['author'],
            order: { created_at: 'DESC' },
        });
    }

    @Post('/')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(@Body() body: CreateBlogPostDto, @Req() req: Request) {
        const post = this.blogRepo.create({
            ...body,
            author: { id: (req as any).user.id },
        });
        return await this.blogRepo.save(post);
    }

    @Get('/:id')
    async getById(@Param('id') id: string) {
        const post = await this.blogRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!post) throw new HttpError(404, 'Пост не найден');
        return post;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    async update(
        @Param('id') id: string,
        @Body() body: UpdateBlogPostDto,
        @Req() req: Request,
    ) {
        const post = await this.blogRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!post) throw new HttpError(404, 'Пост не найден');
        if (post.author.id !== (req as any).user.id)
            throw new HttpError(403, 'Нет прав');

        Object.assign(post, body);
        return await this.blogRepo.save(post);
    }

    @Delete('/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    async delete(@Param('id') id: string, @Req() req: Request) {
        const post = await this.blogRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!post) throw new HttpError(404, 'Пост не найден');
        if (post.author.id !== (req as any).user.id)
            throw new HttpError(403, 'Нет прав');
        await this.blogRepo.softDelete(id);
        return null;
    }

    // Лайки и комменты
    @Post('/:id/like')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async like(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user.id;
        const existing = await this.likeRepo.findOneBy({
            user: { id: userId },
            blog_post: { id },
        });
        if (!existing)
            await this.likeRepo.save(
                this.likeRepo.create({
                    user: { id: userId },
                    blog_post: { id },
                }),
            );
        return { message: 'Лайк поставлен' };
    }

    @Delete('/:id/like')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    async unlike(@Param('id') id: string, @Req() req: Request) {
        await this.likeRepo.delete({
            user: { id: (req as any).user.id },
            blog_post: { id },
        });
        return null;
    }

    @Get('/:id/comments')
    async getComments(
        @Param('id') id: string,
        @QueryParam('limit') limit: number = 20,
        @QueryParam('offset') offset: number = 0,
    ) {
        return await this.commentRepo.find({
            where: { blog_post: { id } },
            relations: ['author'],
            order: { created_at: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    @Post('/:id/comments')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async createComment(
        @Param('id') id: string,
        @Body() body: CreateCommentDto,
        @Req() req: Request,
    ) {
        const comment = this.commentRepo.create({
            content: body.content,
            author: { id: (req as any).user.id },
            blog_post: { id },
        });
        return await this.commentRepo.save(comment);
    }
}
