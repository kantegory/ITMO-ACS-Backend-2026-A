import {
    JsonController,
    Body,
    Get,
    Post,
    Delete,
    Req,
    Res,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsNotEmpty } from 'class-validator';
import { Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { callService, sendResult } from '../utils/call-service';
import { getUsernames } from '../utils/collect-data';

class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    text: string;
}

@JsonController('/v1')
class CommentController {
    @Get('/recipes/:id/comments')
    @OpenAPI({ summary: 'Комментарии к рецепту' })
    async getAll(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'GET',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/recipes/${request.params.id}/comments`,
        );
        if (result.status !== 200) {
            return sendResult(response, result);
        }

        // social-service знает только user_id, имена берём из user-service
        const usernames = await getUsernames(
            result.data.map((comment) => comment.user_id),
        );

        return response.json(
            result.data.map((comment) => ({
                id: comment.id,
                text: comment.text,
                author: {
                    id: comment.user_id,
                    username: usernames[comment.user_id],
                },
                created_at: comment.created_at,
            })),
        );
    }

    @Post('/recipes/:id/comments')
    @OpenAPI({
        summary: 'Оставить комментарий',
        security: [{ bearerAuth: [] }],
    })
    async create(
        @Req() request: Request,
        @Res() response: Response,
        @Body({ type: CreateCommentDto }) commentData: CreateCommentDto,
    ) {
        const result = await callService(
            'POST',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/recipes/${request.params.id}/comments`,
            request,
            commentData,
        );
        if (result.status !== 201) {
            return sendResult(response, result);
        }

        const comment = result.data;
        const usernames = await getUsernames([comment.user_id]);

        return response.status(201).json({
            id: comment.id,
            text: comment.text,
            author: {
                id: comment.user_id,
                username: usernames[comment.user_id],
            },
            created_at: comment.created_at,
        });
    }

    @Delete('/comments/:id')
    @OpenAPI({
        summary: 'Удалить комментарий (автор или админ)',
        security: [{ bearerAuth: [] }],
    })
    async remove(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'DELETE',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/comments/${request.params.id}`,
            request,
        );

        return sendResult(response, result);
    }
}

export default CommentController;
