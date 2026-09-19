import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseBefore,
    Req,
    NotFoundError,
    HttpCode,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Review } from '../models/review.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { serializeReview } from '../utils/serializers';

class ReviewDto {
    @IsOptional()
    @IsInt()
    restaurant?: number;

    @IsOptional()
    @IsInt()
    user?: number;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

@EntityController({
    baseRoute: '/reviews',
    entity: Review,
})
class ReviewController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Список отзывов', tags: ['Отзывы'] })
    async getAll() {
        const reviews = await this.repository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
        return reviews.map(serializeReview);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Отзыв', tags: ['Отзывы'] })
    async getById(@Param('id') id: number) {
        const review = await this.repository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!review) {
            throw new NotFoundError('Review not found');
        }
        return serializeReview(review);
    }

    @Post('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создать отзыв', tags: ['Отзывы'] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: ReviewDto }) data: ReviewDto,
    ) {
        const review = this.repository.create({
            restaurantId: data.restaurant,
            userId: request.user.id,
            rating: data.rating,
            comment: data.comment,
        });
        const saved = await this.repository.save(review);
        const full = await this.repository.findOne({
            where: { id: saved.id },
            relations: ['user'],
        });
        return serializeReview(full);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновить отзыв', tags: ['Отзывы'] })
    async update(@Param('id') id: number, @Body({ type: ReviewDto }) data: ReviewDto) {
        const review = await this.repository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!review) {
            throw new NotFoundError('Review not found');
        }

        if (data.rating !== undefined) review.rating = data.rating;
        if (data.comment !== undefined) review.comment = data.comment;

        await this.repository.save(review);
        return serializeReview(review);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @HttpCode(204)
    @OpenAPI({ summary: 'Удалить отзыв', tags: ['Отзывы'] })
    async delete(@Param('id') id: number) {
        const review = await this.repository.findOneBy({ id });
        if (!review) {
            throw new NotFoundError('Review not found');
        }
        await this.repository.remove(review);
    }
}

export default ReviewController;
