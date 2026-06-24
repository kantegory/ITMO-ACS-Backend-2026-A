import {
    Body,
    Delete,
    Get,
    NotFoundError,
    Param,
    Patch,
    Post,
    QueryParam,
    UseBefore,
} from 'routing-controllers';
import { Req } from 'routing-controllers';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import BaseController from '../common/base-controller';
import EntityController from '../common/entity-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Review } from '../models/review.entity';
import { Carpet } from '../models/carpet.entity';
import { OrderItem } from '../models/order-item.entity';
import { assertAdminOrOwner } from '../utils/ownership';

class ReviewCreateDto {
    @IsInt()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}

class ReviewUpdateDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating?: number;

    @IsOptional()
    @IsString()
    @Type(() => String)
    comment?: string;
}

@EntityController({ baseRoute: '/carpets', entity: Review })
export default class ReviewsController extends BaseController {
    @Get('/:id/reviews')
    async list(
        @Param('id') carpetId: number,
        @QueryParam('limit') limit = 20,
        @QueryParam('offset') offset = 0,
    ) {
        const carpet = await dataSource.getRepository(Carpet).findOneBy({ id: carpetId });
        if (!carpet) throw new NotFoundError('Carpet not found');

        const repo = dataSource.getRepository(Review);
        const [items] = await repo.findAndCount({
            where: { carpet: { id: carpetId } },
            relations: { user: true },
            take: limit,
            skip: offset,
            order: { created_at: 'DESC' },
        });

        return items;
    }

    @Post('/:id/reviews')
    @UseBefore(authMiddleware)
    async create(
        @Param('id') carpetId: number,
        @Body({ type: ReviewCreateDto }) dto: ReviewCreateDto,
        @Req() request: RequestWithUser,
    ) {
        const carpet = await dataSource.getRepository(Carpet).findOneBy({ id: carpetId });
        if (!carpet) throw new NotFoundError('Carpet not found');

        const reviewRepo = dataSource.getRepository(Review);
        const exists = await reviewRepo.findOne({
            where: { user: { id: request.user.id }, carpet: { id: carpetId } },
            relations: { user: true, carpet: true },
        });
        if (exists) {
            const err: any = new Error('Review already exists');
            err.httpCode = 409;
            throw err;
        }

        // must have purchased: at least one order item for this user+carpet
        const purchasedCount = await dataSource
            .getRepository(OrderItem)
            .createQueryBuilder('oi')
            .innerJoin('oi.order', 'o')
            .innerJoin('oi.carpet', 'c')
            .where('o.userId = :userId', { userId: request.user.id })
            .andWhere('c.id = :carpetId', { carpetId })
            .getCount();

        if (purchasedCount <= 0) {
            const err: any = new Error('Review allowed only after purchase');
            err.httpCode = 403;
            throw err;
        }

        const review = reviewRepo.create({
            user: { id: request.user.id } as any,
            carpet: { id: carpetId } as any,
            rating: dto.rating,
            comment: dto.comment ?? null,
        });

        return await reviewRepo.save(review);
    }

    @Patch('/:carpet_id/reviews/:review_id')
    @UseBefore(authMiddleware)
    async update(
        @Param('carpet_id') carpetId: number,
        @Param('review_id') reviewId: number,
        @Body({ type: ReviewUpdateDto }) dto: ReviewUpdateDto,
        @Req() request: RequestWithUser,
    ) {
        const repo = dataSource.getRepository(Review);
        const review = await repo.findOne({
            where: { id: reviewId, carpet: { id: carpetId } },
            relations: { user: true, carpet: true },
        });
        if (!review) throw new NotFoundError('Carpet or review not found');

        assertAdminOrOwner({
            requesterUserId: request.user.id,
            requesterRole: request.user.role,
            ownerUserId: review.user.id,
        });

        Object.assign(review, {
            ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
            ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
        });

        return await repo.save(review);
    }

    @Delete('/:carpet_id/reviews/:review_id')
    @UseBefore(authMiddleware)
    async remove(
        @Param('carpet_id') carpetId: number,
        @Param('review_id') reviewId: number,
        @Req() request: RequestWithUser,
    ) {
        const repo = dataSource.getRepository(Review);
        const review = await repo.findOne({
            where: { id: reviewId, carpet: { id: carpetId } },
            relations: { user: true, carpet: true },
        });
        if (!review) throw new NotFoundError('Carpet or review not found');

        assertAdminOrOwner({
            requesterUserId: request.user.id,
            requesterRole: request.user.role,
            ownerUserId: review.user.id,
        });

        await repo.remove(review);
        return;
    }
}

