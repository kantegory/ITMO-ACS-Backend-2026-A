import { Get, Param, QueryParam, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import SETTINGS from '../config/settings';
import serviceAuthMiddleware from '../middlewares/service-auth.middleware';
import dataSource from '../config/data-source';
import { LandlordReview } from '../models/landlord-review.entity';

async function fetchUser(userId: number): Promise<any | null> {
    try {
        const res = await fetch(`${SETTINGS.USER_SERVICE_URL}/internal/users/${userId}`, {
            headers: { 'X-Service-Token': SETTINGS.SERVICE_TOKEN },
        });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

@JsonController('/internal/reviews')
class InternalReviewController {
    @Get('/landlord-rating/:landlordId')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Средний рейтинг арендодателя (internal)' })
    async getLandlordRating(@Param('landlordId') landlordId: number, @Res() res: Response) {
        const reviewRepo = dataSource.getRepository(LandlordReview);
        const agg = await reviewRepo
            .createQueryBuilder('r')
            .select('COALESCE(AVG(r.rating), 0)', 'avg')
            .addSelect('COUNT(r.id)', 'count')
            .where('r.landlordId = :landlordId AND r.deletedAt IS NULL', { landlordId })
            .getRawOne<{ avg: string; count: string }>();

        const count = parseInt(agg.count);
        return res.json({
            average_rating: count > 0 ? parseFloat(parseFloat(agg.avg).toFixed(2)) : null,
            review_count: count,
        });
    }

    @Get('/landlord/:id')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Отзывы об арендодателе (internal)' })
    async getLandlordReviews(
        @Param('id') id: number,
        @QueryParam('page') page: number = 1,
        @QueryParam('page_size') pageSize: number = 20,
        @Res() res: Response,
    ) {
        const reviewRepo = dataSource.getRepository(LandlordReview);

        const [items, total] = await reviewRepo.findAndCount({
            where: { landlordId: id },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const agg = await reviewRepo
            .createQueryBuilder('r')
            .select('COALESCE(AVG(r.rating), 0)', 'avg')
            .where('r.landlordId = :id AND r.deletedAt IS NULL', { id })
            .getRawOne<{ avg: string }>();
        const avgRating = total > 0 ? parseFloat(parseFloat(agg.avg).toFixed(2)) : null;

        const reviewerIds = [...new Set(items.map((r) => r.reviewerId))];
        const reviewerMap: Record<number, any> = {};
        await Promise.all(reviewerIds.map(async (uid) => {
            const u = await fetchUser(uid);
            if (u) reviewerMap[uid] = u;
        }));

        return res.json({
            items: items.map((r) => {
                const reviewer = reviewerMap[r.reviewerId];
                return {
                    id: r.id,
                    reviewer: reviewer
                        ? { id: reviewer.id, first_name: reviewer.first_name, last_name: reviewer.last_name, avatar_url: reviewer.avatar_url ?? null }
                        : { id: r.reviewerId },
                    rating: r.rating,
                    comment: r.comment ?? null,
                    created_at: r.createdAt,
                };
            }),
            average_rating: avgRating,
            total,
        });
    }
}

export default InternalReviewController;
