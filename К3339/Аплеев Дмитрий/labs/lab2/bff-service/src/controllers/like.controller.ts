import { JsonController, Put, Delete, Req, Res } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { callService, sendResult } from '../utils/call-service';

// лайки целиком в social-service, BFF только пересылает запрос
@JsonController('/v1/recipes')
class LikeController {
    @Put('/:id/like')
    @OpenAPI({ summary: 'Поставить лайк', security: [{ bearerAuth: [] }] })
    async like(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'PUT',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/recipes/${request.params.id}/like`,
            request,
        );

        return sendResult(response, result);
    }

    @Delete('/:id/like')
    @OpenAPI({ summary: 'Убрать лайк', security: [{ bearerAuth: [] }] })
    async unlike(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'DELETE',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/recipes/${request.params.id}/like`,
            request,
        );

        return sendResult(response, result);
    }
}

export default LikeController;
