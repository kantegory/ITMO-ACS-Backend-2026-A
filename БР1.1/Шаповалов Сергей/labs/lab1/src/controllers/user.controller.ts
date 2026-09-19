import {
    Body,
    Get,
    Patch,
    UseBefore,
    Req,
    NotFoundError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import { Reservation } from '../models/reservation.entity';
import { Review } from '../models/review.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import {
    serializeUser,
    serializeReservation,
    serializeReview,
} from '../utils/serializers';

class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    first_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    last_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    middle_name?: string;
}

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Личный кабинет', tags: ['Профиль'] })
    async me(@Req() request: RequestWithUser) {
        const user = await this.repository.findOne({
            where: { id: request.user.id },
            relations: ['role'],
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return serializeUser(user);
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновить профиль', tags: ['Профиль'] })
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateProfileDto }) data: UpdateProfileDto,
    ) {
        const user = await this.repository.findOne({
            where: { id: request.user.id },
            relations: ['role'],
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (data.first_name !== undefined) user.firstName = data.first_name;
        if (data.last_name !== undefined) user.lastName = data.last_name;
        if (data.middle_name !== undefined) user.middleName = data.middle_name;

        await this.repository.save(user);
        return serializeUser(user);
    }

    @Get('/me/reservations')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'История бронирований', tags: ['Профиль'] })
    async myReservations(@Req() request: RequestWithUser) {
        const reservationRepository = dataSource.getRepository(Reservation);
        const reservations = await reservationRepository.find({
            where: { userId: request.user.id },
            relations: ['restaurant', 'user'],
            order: { createdAt: 'DESC' },
        });

        return reservations.map(serializeReservation);
    }

    @Get('/me/reviews')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Мои отзывы', tags: ['Профиль'] })
    async myReviews(@Req() request: RequestWithUser) {
        const reviewRepository = dataSource.getRepository(Review);
        const reviews = await reviewRepository.find({
            where: { userId: request.user.id },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });

        return reviews.map(serializeReview);
    }
}

export default UserController;
