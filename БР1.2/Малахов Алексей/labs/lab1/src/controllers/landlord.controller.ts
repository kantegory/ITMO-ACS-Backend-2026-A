import { Get, Param, QueryParam, Res } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response } from 'express';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { LandlordReview } from '../models/landlord-review.entity';
import { User } from '../models/user.entity';

@EntityController({ baseRoute: '/landlords', entity: LandlordReview })
class LandlordController extends BaseController {
    @Get('/:id/reviews')
    @OpenAPI({ summary: 'Отзывы об арендодателе' })
    async getReviews(
        @Param('id') id: number,
        @QueryParam('page') page: number = 1,
        @QueryParam('page_size') pageSize: number = 20,
        @Res() res: Response,
    ) {
        const landlord = await dataSource.getRepository(User).findOneBy({ id });
        if (!landlord) return res.status(404).json({ code: 'NOT_FOUND', message: 'Арендодатель не найден' });

        const reviewRepo = dataSource.getRepository(LandlordReview);

        const [items, total] = await reviewRepo.findAndCount({
            where: { landlordId: id },
            relations: ['reviewer'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const agg = await reviewRepo
            .createQueryBuilder('r')
            .select('COALESCE(AVG(r.rating), 0)', 'avg')
            .where('r.landlordId = :id AND r.deletedAt IS NULL', { id })
            .getRawOne<{ avg: string }>();
        const avgRating = total ? parseFloat(agg.avg) : null;

        return res.json({
            items: items.map((r) => ({
                id: r.id,
                reviewer: {
                    id: r.reviewer.id,
                    first_name: r.reviewer.firstName,
                    last_name: r.reviewer.lastName,
                    email: r.reviewer.email,
                    avatar_url: r.reviewer.avatarUrl ?? null,
                    roles: [],
                },
                rating: r.rating,
                comment: r.comment ?? null,
                created_at: r.createdAt,
            })),
            average_rating: avgRating,
            total,
        });
    }
}

export default LandlordController;
