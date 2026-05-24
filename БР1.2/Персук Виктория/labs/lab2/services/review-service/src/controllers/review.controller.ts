import { Body, Delete, Param, Patch, Post, HttpCode, UseBefore, Req } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import axios from 'axios';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Review } from '../models/review.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto';
import { publishReviewCreated, publishReviewDeleted } from '../messaging/publisher';
import SETTINGS from '../config/settings';

@EntityController({ baseRoute: '/reviews', entity: Review })
class ReviewController extends BaseController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a review', security: [{ bearerAuth: [] }] })
    async create(@Req() request: RequestWithUser, @Body({ type: CreateReviewDto }) body: CreateReviewDto) {
        const { user } = request;

        try {
            await axios.get(`${SETTINGS.RESTAURANT_SERVICE_URL}/internal/restaurants/${body.restaurant_id}`);
        } catch {
            return { message: 'Restaurant not found' };
        }

        const review = this.repository.create({ ...body, user_id: user.id });
        const saved = await this.repository.save(review) as Review;

        await publishReviewCreated({
            review_id: saved.review_id,
            restaurant_id: saved.restaurant_id,
            user_id: user.id,
            rating: Number(saved.rating),
            comment: saved.comment,
        });

        return saved;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update a review', security: [{ bearerAuth: [] }] })
    async update(@Param('id') id: number, @Req() request: RequestWithUser, @Body({ type: UpdateReviewDto }) body: UpdateReviewDto) {
        const { user } = request;
        const review = await this.repository.findOneBy({ review_id: id }) as Review;

        if (!review) return { message: 'Review not found' };
        if (review.user_id !== user.id) return { message: 'Forbidden' };

        Object.assign(review, body);
        const saved = await this.repository.save(review) as Review;

        await publishReviewCreated({
            review_id: saved.review_id,
            restaurant_id: saved.restaurant_id,
            user_id: user.id,
            rating: Number(saved.rating),
        });

        return saved;
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete a review', security: [{ bearerAuth: [] }] })
    async delete(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const review = await this.repository.findOneBy({ review_id: id }) as Review;

        if (!review) return { message: 'Review not found' };
        if (review.user_id !== user.id) return { message: 'Forbidden' };

        await this.repository.delete({ review_id: id });

        await publishReviewDeleted({
            review_id: id,
            restaurant_id: review.restaurant_id,
        });

        return { message: 'Review deleted' };
    }
}

export default ReviewController;
