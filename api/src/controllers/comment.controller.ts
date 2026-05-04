import {
    Body,
    Get,
    Post,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Comment } from '../models/comment.entity';
import { User } from '../models/user.entity';
import { Recipe } from '../models/recipe.entity';

class CreateCommentDto {
    @IsString()
    text: string;

    @IsNumber()
    @Type(() => Number)
    userId: number;

    @IsNumber()
    @Type(() => Number)
    recipeId: number;
}

@EntityController({
    baseRoute: '/comments',
    entity: Comment,
})
class CommentController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Get comments by recipe' })
    async getComments(
        @QueryParam('recipeId', { required: true, type: Number }) recipeId: number,
    ) {
        return this.repository.find({
            where: {
                recipe: { id: recipeId },
            },
            relations: {
                user: true,
            },
        });
    }

    @Post('/')
    @OpenAPI({ summary: 'Create comment' })
    async createComment(
        @Body({ type: CreateCommentDto }) data: CreateCommentDto,
    ) {
        const user = await User.findOneBy({ id: data.userId });
        const recipe = await Recipe.findOneBy({ id: data.recipeId });

        if (!user || !recipe) {
            return { message: 'User or Recipe not found' };
        }

        const comment = this.repository.create({
            text: data.text,
            user,
            recipe,
        });

        return this.repository.save(comment);
    }
}

export default CommentController;
