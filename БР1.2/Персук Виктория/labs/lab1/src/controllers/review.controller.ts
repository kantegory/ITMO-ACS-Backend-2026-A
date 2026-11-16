import {
    Body,
    Delete,
    Param,
    Patch,
    UseBefore,
    Req,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Review } from '../models/review.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { UpdateReviewDto } from '../dto/review.dto';

@EntityController({
    baseRoute: '/reviews',
    entity: Review,
})
class ReviewController extends BaseController {
    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update a review', security: [{ bearerAuth: [] }] })
    async update(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: UpdateReviewDto }) body: UpdateReviewDto,
    ) {
        const { user } = request;
        const review = await this.repository.findOneBy({ review_id: id }) as Review;

        if (!review) {
            return { message: 'Review not found' };
        }

        if (review.user_id !== user.id) {
            return { message: 'Forbidden' };
        }

        Object.assign(review, body);
        return await this.repository.save(review);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete a review', security: [{ bearerAuth: [] }] })
    async delete(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const { user } = request;
        const review = await this.repository.findOneBy({ review_id: id }) as Review;

        if (!review) {
            return { message: 'Review not found' };
        }

        if (review.user_id !== user.id) {
            return { message: 'Forbidden' };
        }

        await this.repository.delete({ review_id: id });
        return { message: 'Review deleted' };
    }
}

export default ReviewController;
