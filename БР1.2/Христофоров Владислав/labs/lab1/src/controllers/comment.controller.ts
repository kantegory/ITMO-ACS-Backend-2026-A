import {
    JsonController,
    Patch,
    Delete,
    Body,
    Param,
    HttpError,
    Req,
    UseBefore,
    HttpCode,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import authMiddleware from '../middlewares/auth.middleware';
import { Comment } from '../models/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { Request } from 'express';

@JsonController('/comments')
export class CommentController {
    private commentRepo = dataSource.getRepository(Comment);

    @Patch('/:id')
    @UseBefore(authMiddleware)
    async update(
        @Param('id') id: string,
        @Body() body: CreateCommentDto,
        @Req() req: Request,
    ) {
        const comment = await this.commentRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!comment) throw new HttpError(404, 'Комментарий не найден');
        if (comment.author.id !== (req as any).user.id)
            throw new HttpError(403, 'Вы не автор');

        comment.content = body.content;
        return await this.commentRepo.save(comment);
    }

    @Delete('/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    async delete(@Param('id') id: string, @Req() req: Request) {
        const comment = await this.commentRepo.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!comment) throw new HttpError(404, 'Комментарий не найден');
        if (comment.author.id !== (req as any).user.id)
            throw new HttpError(403, 'Вы не автор');

        await this.commentRepo.softDelete(id);
        return null;
    }
}
