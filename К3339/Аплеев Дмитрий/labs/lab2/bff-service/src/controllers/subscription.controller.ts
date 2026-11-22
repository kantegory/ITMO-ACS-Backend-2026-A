import {
    JsonController,
    Get,
    Put,
    Delete,
    Req,
    Res,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { callService, sendResult } from '../utils/call-service';
import { getUsernames } from '../utils/collect-data';

@JsonController('/v1/users')
class SubscriptionController {
    @Get('/me/subscriptions')
    @OpenAPI({ summary: 'На кого я подписан', security: [{ bearerAuth: [] }] })
    async getMySubscriptions(
        @Req() request: Request,
        @Res() response: Response,
    ) {
        // social-service возвращает только id авторов
        const result = await callService(
            'GET',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/users/me/subscriptions`,
            request,
        );
        if (result.status !== 200) {
            return sendResult(response, result);
        }

        const authorIds: number[] = result.data;
        const usernames = await getUsernames(authorIds);

        // пользователей, которых нет в user-service, пропускаем
        const authors = [];
        for (const id of authorIds) {
            if (usernames[id]) {
                authors.push({ id, username: usernames[id] });
            }
        }

        return response.json(authors);
    }

    @Put('/:id/subscribe')
    @OpenAPI({
        summary: 'Подписаться на пользователя',
        security: [{ bearerAuth: [] }],
    })
    async subscribe(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'PUT',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/users/${request.params.id}/subscribe`,
            request,
        );

        return sendResult(response, result);
    }

    @Delete('/:id/subscribe')
    @OpenAPI({ summary: 'Отписаться', security: [{ bearerAuth: [] }] })
    async unsubscribe(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'DELETE',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/users/${request.params.id}/subscribe`,
            request,
        );

        return sendResult(response, result);
    }
}

export default SubscriptionController;
