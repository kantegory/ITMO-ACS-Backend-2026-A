import {
    Body,
    Get,
    Post,
    Delete,
    UseBefore,
    Req,
    HttpCode,
    OnUndefined,
    ForbiddenError,
    NotFoundError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsNotEmpty } from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Comment } from '../models/comment.entity';
import { Recipe } from '../models/recipe.entity';
import { Role } from '../models/enums';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    text: string;
}

@EntityController({
    baseRoute: '',
    entity: Comment,
})
class CommentController extends BaseController {
    @Get('/recipes/:id/comments')
    @OpenAPI({ summary: 'Комментарии к рецепту' })
    async getAll(@Req() request: RequestWithUser) {
        const recipeId = Number(request.params.id);

        const recipe = await dataSource
            .getRepository(Recipe)
            .findOneBy({ id: recipeId });
        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        const comments = await this.repository.find({
            where: { recipe_id: recipeId },
            relations: { user: true },
            order: { created_at: 'ASC' },
        });

        return comments.map((comment) => ({
            id: comment.id,
            text: comment.text,
            author: { id: comment.user.id, username: comment.user.username },
            created_at: comment.created_at,
        }));
    }

    @Post('/recipes/:id/comments')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Оставить комментарий',
        security: [{ bearerAuth: [] }],
    })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateCommentDto }) commentData: CreateCommentDto,
    ) {
        const recipeId = Number(request.params.id);

        const recipe = await dataSource
            .getRepository(Recipe)
            .findOneBy({ id: recipeId });
        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        const comment = this.repository.create({
            recipe_id: recipeId,
            user_id: request.user.id,
            text: commentData.text,
        });
        const savedComment = await this.repository.save(comment);

        // загружаем ещё раз вместе с автором, чтобы вернуть его username
        const commentWithUser = await this.repository.findOne({
            where: { id: savedComment.id },
            relations: { user: true },
        });

        return {
            id: commentWithUser.id,
            text: commentWithUser.text,
            author: {
                id: commentWithUser.user.id,
                username: commentWithUser.user.username,
            },
            created_at: commentWithUser.created_at,
        };
    }

    @Delete('/comments/:id')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Удалить комментарий (автор или админ)',
        security: [{ bearerAuth: [] }],
    })
    async remove(@Req() request: RequestWithUser) {
        const id = Number(request.params.id);
        const comment = await this.repository.findOneBy({ id });

        if (!comment) {
            throw new NotFoundError('Comment not found');
        }

        if (
            comment.user_id !== request.user.id &&
            request.user.role !== Role.ADMIN
        ) {
            throw new ForbiddenError('You can delete only your own comments');
        }

        await this.repository.delete({ id });
    }
}

export default CommentController;
