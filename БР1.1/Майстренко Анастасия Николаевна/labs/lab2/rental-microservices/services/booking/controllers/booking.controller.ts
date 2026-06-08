import {
    Get, Post, Patch, Param, QueryParam, Body, Req, UseBefore, HttpCode,
    NotFoundError, ForbiddenError, BadRequestError,
} from 'routing-controllers';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import authMiddleware, { RequestWithUser } from '../../../shared/auth.middleware';
import { paginate } from '../../../shared/paginate';
import { internalGet, internalPatch } from '../../../shared/internal-client';

import dataSource from '../data-source';
import { Booking, BookingStatus } from '../models/booking.entity';
import { Review } from '../models/review.entity';
import { CreateBookingDto, UpdateBookingStatusDto, CreateReviewDto } from '../dto/booking.dto';

const CATALOG_URL = process.env.CATALOG_URL || 'http://localhost:8002';

function daysBetween(s: string, e: string): number {
    return Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24));
}

@EntityController({ baseRoute: '/bookings', entity: Booking, dataSource })
class BookingController extends BaseController {
    private reviews = dataSource.getRepository(Review);

    @Get('')
    @UseBefore(authMiddleware)
    async list(
        @Req() req: RequestWithUser,
        @QueryParam('status') status: string,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        const qb = this.repository.createQueryBuilder('b').where('b.tenantId = :id', { id: req.user.id });
        if (status) qb.andWhere('b.status = :status', { status });
        qb.orderBy('b.createdAt', 'DESC');
        return paginate(qb, page, limit);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(@Req() req: RequestWithUser, @Body() data: CreateBookingDto) {
        // === МЕЖСЕРВИСНЫЙ ВЫЗОВ: получаем цену и владельца объекта из Catalog Service ===
        const property = await internalGet<{ id: number; ownerId: number; title: string; pricePerDay: number; status: string }>(
            `${CATALOG_URL}/internal/properties/${data.propertyId}`,
        );
        if (!property) throw new NotFoundError('Объект не найден в каталоге');
        if (property.status !== 'available') throw new BadRequestError('Объект недоступен для аренды');

        const days = daysBetween(data.startDate, data.endDate);
        if (days <= 0) throw new BadRequestError('Дата окончания должна быть позже даты начала');

        const booking = this.repository.create({
            propertyId: data.propertyId,
            tenantId: req.user.id,
            propertyTitle: property.title,
            startDate: data.startDate,
            endDate: data.endDate,
            totalPrice: days * property.pricePerDay,
            status: BookingStatus.PENDING,
        });
        return this.repository.save(booking);
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    async getOne(@Req() req: RequestWithUser, @Param('id') id: number) {
        const booking = await this.repository.findOneBy({ id });
        if (!booking) throw new NotFoundError('Сделка не найдена');
        if (booking.tenantId !== req.user.id) throw new ForbiddenError('Нет доступа к этой сделке');
        return booking;
    }

    @Patch('/:id/status')
    @UseBefore(authMiddleware)
    async changeStatus(@Req() req: RequestWithUser, @Param('id') id: number, @Body() data: UpdateBookingStatusDto) {
        const booking = await this.repository.findOneBy({ id });
        if (!booking) throw new NotFoundError('Сделка не найдена');
        booking.status = data.status;
        await this.repository.save(booking);

        // === МЕЖСЕРВИСНЫЙ ВЫЗОВ: синхронизируем статус объекта в Catalog Service ===
        try {
            if (data.status === BookingStatus.CONFIRMED || data.status === BookingStatus.ACTIVE) {
                await internalPatch(`${CATALOG_URL}/internal/properties/${booking.propertyId}/status`, { status: 'rented' });
            } else if (data.status === BookingStatus.COMPLETED || data.status === BookingStatus.CANCELLED) {
                await internalPatch(`${CATALOG_URL}/internal/properties/${booking.propertyId}/status`, { status: 'available' });
            }
        } catch (e) {
            console.error('Не удалось синхронизировать статус объекта:', (e as Error).message);
        }
        return booking;
    }

    @Post('/:id/review')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async addReview(@Req() req: RequestWithUser, @Param('id') id: number, @Body() data: CreateReviewDto) {
        const booking = await this.repository.findOneBy({ id });
        if (!booking) throw new NotFoundError('Сделка не найдена');
        if (booking.tenantId !== req.user.id) throw new ForbiddenError('Отзыв может оставить только арендатор');
        if (booking.status !== BookingStatus.COMPLETED) throw new BadRequestError('Отзыв доступен только по завершённой сделке');

        const review = this.reviews.create({ bookingId: id, authorId: req.user.id, rating: data.rating, text: data.text ?? '' });
        return this.reviews.save(review);
    }
}

export default BookingController;
