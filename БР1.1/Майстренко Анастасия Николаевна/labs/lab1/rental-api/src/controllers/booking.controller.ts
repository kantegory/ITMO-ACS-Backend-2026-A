import {
    Get,
    Post,
    Patch,
    Param,
    QueryParam,
    Body,
    Req,
    UseBefore,
    HttpCode,
    NotFoundError,
    ForbiddenError,
    BadRequestError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Booking } from '../models/booking.entity';
import { Property } from '../models/property.entity';
import { Review } from '../models/review.entity';
import { BookingStatus } from '../models/enums';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { CreateBookingDto, UpdateBookingStatusDto } from '../dto/booking.dto';
import { CreateReviewDto } from '../dto/review.dto';
import { paginate } from '../utils/paginate';

function daysBetween(start: string, end: string): number {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}

@EntityController({ baseRoute: '/bookings', entity: Booking })
class BookingController extends BaseController {
    private properties = dataSource.getRepository(Property);
    private reviews = dataSource.getRepository(Review);

    @Get('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'История сделок пользователя', security: [{ bearerAuth: [] }] })
    async list(
        @Req() req: RequestWithUser,
        @QueryParam('role') role: string,
        @QueryParam('status') status: string,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        const qb = this.repository
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.property', 'property');

        if (role === 'landlord') {
            qb.where('property.ownerId = :id', { id: req.user.id });
        } else if (role === 'tenant') {
            qb.where('b.tenantId = :id', { id: req.user.id });
        } else {
            qb.where('b.tenantId = :id OR property.ownerId = :id', {
                id: req.user.id,
            });
        }
        if (status) qb.andWhere('b.status = :status', { status });
        qb.orderBy('b.createdAt', 'DESC');

        return paginate(qb, page, limit);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создать бронирование', security: [{ bearerAuth: [] }] })
    async create(@Req() req: RequestWithUser, @Body() data: CreateBookingDto) {
        const property = await this.properties.findOneBy({
            id: data.propertyId,
        });
        if (!property) throw new NotFoundError('Объект не найден');

        const days = daysBetween(data.startDate, data.endDate);
        if (days <= 0) {
            throw new BadRequestError('Дата окончания должна быть позже даты начала');
        }

        const booking = this.repository.create({
            propertyId: data.propertyId,
            tenantId: req.user.id,
            startDate: data.startDate,
            endDate: data.endDate,
            totalPrice: days * property.pricePerDay,
            status: BookingStatus.PENDING,
        });
        return this.repository.save(booking);
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Детали сделки', security: [{ bearerAuth: [] }] })
    async getOne(@Req() req: RequestWithUser, @Param('id') id: number) {
        const booking = await this.repository.findOne({
            where: { id },
            relations: { property: true },
        });
        if (!booking) throw new NotFoundError('Сделка не найдена');
        if (
            booking.tenantId !== req.user.id &&
            booking.property.ownerId !== req.user.id
        ) {
            throw new ForbiddenError('Нет доступа к этой сделке');
        }
        return booking;
    }

    @Patch('/:id/status')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Изменить статус сделки', security: [{ bearerAuth: [] }] })
    async changeStatus(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() data: UpdateBookingStatusDto,
    ) {
        const booking = await this.repository.findOne({
            where: { id },
            relations: { property: true },
        });
        if (!booking) throw new NotFoundError('Сделка не найдена');

        const isTenant = booking.tenantId === req.user.id;
        const isOwner = booking.property.ownerId === req.user.id;
        if (!isTenant && !isOwner) {
            throw new ForbiddenError('Нет доступа к этой сделке');
        }

        booking.status = data.status;
        return this.repository.save(booking);
    }

    @Post('/:id/review')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Оставить отзыв по сделке', security: [{ bearerAuth: [] }] })
    async addReview(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() data: CreateReviewDto,
    ) {
        const booking = await this.repository.findOneBy({ id });
        if (!booking) throw new NotFoundError('Сделка не найдена');
        if (booking.tenantId !== req.user.id) {
            throw new ForbiddenError('Отзыв может оставить только арендатор');
        }
        if (booking.status !== BookingStatus.COMPLETED) {
            throw new BadRequestError('Отзыв доступен только по завершённой сделке');
        }

        const review = this.reviews.create({
            bookingId: id,
            authorId: req.user.id,
            rating: data.rating,
            text: data.text ?? '',
        });
        return this.reviews.save(review);
    }
}

export default BookingController;
