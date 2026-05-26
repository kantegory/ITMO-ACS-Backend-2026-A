import {
    Post, Body, Param, Req, Res, UseBefore, HttpCode, Get, QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import SETTINGS from '../config/settings';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { LandlordReview } from '../models/landlord-review.entity';

class CreateReviewDto {
    @IsInt() @Type(() => Number) rental_id: number;
    @IsInt() @Min(1) @Max(5) @Type(() => Number) rating: number;
    @IsString() @IsOptional() comment?: string;
}

async function fetchRental(rentalId: number): Promise<any | null> {
    try {
        const res = await fetch(`${SETTINGS.RENTAL_SERVICE_URL}/internal/rentals/${rentalId}`, {
            headers: { 'X-Service-Token': SETTINGS.SERVICE_TOKEN },
        });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

async function fetchUser(userId: number): Promise<any | null> {
    try {
        const res = await fetch(`${SETTINGS.USER_SERVICE_URL}/internal/users/${userId}`, {
            headers: { 'X-Service-Token': SETTINGS.SERVICE_TOKEN },
        });
        if (!res.ok) return null;
        return res.json();
    } catch { return null; }
}

@JsonController('/reviews')
class ReviewController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Оставить отзыв об арендодателе', security: [{ bearerAuth: [] }] })
    async create(@Req() req: RequestWithUser, @Body({ type: CreateReviewDto }) dto: CreateReviewDto, @Res() res: Response) {
        const rental = await fetchRental(dto.rental_id);
        if (!rental) return res.status(404).json({ code: 'NOT_FOUND', message: 'Аренда не найдена' });

        if (rental.renter_id !== req.user.id) {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
        }
        if (rental.status !== 'completed') {
            return res.status(422).json({ code: 'RENTAL_NOT_COMPLETED', message: 'Аренда не завершена' });
        }

        const reviewRepo = dataSource.getRepository(LandlordReview);
        const existing = await reviewRepo.findOneBy({ rentalId: dto.rental_id, reviewerId: req.user.id });
        if (existing) return res.status(409).json({ code: 'REVIEW_ALREADY_EXISTS', message: 'Отзыв уже существует' });

        const landlordId = rental.owner_id;
        const review = reviewRepo.create({
            landlordId,
            reviewerId: req.user.id,
            rentalId: dto.rental_id,
            rating: dto.rating,
            comment: dto.comment ?? null,
        });
        await reviewRepo.save(review);

        const reviewer = await fetchUser(req.user.id);

        return res.status(201).json({
            id: review.id,
            reviewer: reviewer
                ? { id: reviewer.id, first_name: reviewer.first_name, last_name: reviewer.last_name, avatar_url: reviewer.avatar_url ?? null }
                : { id: req.user.id },
            rating: review.rating,
            comment: review.comment ?? null,
            created_at: review.createdAt,
        });
    }
}

export default ReviewController;
