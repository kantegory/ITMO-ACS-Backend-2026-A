import { Get, Param, QueryParam, Res } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';

@JsonController('/landlords')
class LandlordController {
    @Get('/:id/reviews')
    @OpenAPI({ summary: 'Отзывы об арендодателе' })
    async getReviews(@Param('id') id: number, @QueryParam('page') page: number = 1, @QueryParam('page_size') pageSize: number = 20, @Res() res: Response) {
        const landlord = await dataSource.getRepository(User).findOneBy({ id });
        if (!landlord) return res.status(404).json({ code: 'NOT_FOUND', message: 'Арендодатель не найден' });

        // Получаем отзывы из review-service
        try {
            const reviewRes = await fetch(
                `${SETTINGS.REVIEW_SERVICE_URL}/internal/reviews/landlord/${id}?page=${page}&page_size=${pageSize}`,
                { headers: { 'X-Service-Token': SETTINGS.SERVICE_TOKEN } }
            );
            const data = await reviewRes.json();
            return res.json(data);
        } catch {
            return res.status(502).json({ code: 'SERVICE_UNAVAILABLE', message: 'Review service unavailable' });
        }
    }
}

export default LandlordController;
