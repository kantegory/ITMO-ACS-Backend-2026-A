import {
    Get, Post, Patch, Body, Param, QueryParam, Req, Res, UseBefore, HttpCode,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsNumber, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import SETTINGS from '../config/settings';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { publishRentalStatusChanged } from '../messaging/publisher';
import { Rental } from '../models/rental.entity';
import { RentalStatus, CurrencyType } from '../models/enums';

class CreateRentalDto {
    @IsInt() @Type(() => Number) property_id: number;
    @IsNumber() @Type(() => Number) agreed_price: number;
    @IsDateString() start_date: string;
    @IsDateString() @IsOptional() end_date?: string;
    @IsNumber() @IsOptional() @Type(() => Number) deposit_amount?: number;
}

class UpdateRentalStatusDto {
    @IsEnum(RentalStatus) status: RentalStatus;
    @IsString() @IsOptional() cancel_reason?: string;
}

const VALID_TRANSITIONS: Record<RentalStatus, RentalStatus[]> = {
    [RentalStatus.PENDING]: [RentalStatus.ACTIVE, RentalStatus.CANCELLED],
    [RentalStatus.ACTIVE]: [RentalStatus.COMPLETED, RentalStatus.CANCELLED],
    [RentalStatus.COMPLETED]: [],
    [RentalStatus.CANCELLED]: [],
};

async function fetchProperty(propertyId: number): Promise<any | null> {
    try {
        const res = await fetch(`${SETTINGS.PROPERTY_SERVICE_URL}/internal/properties/${propertyId}`, {
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

@JsonController('/rentals')
class RentalController {
    @Get('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Список аренд текущего пользователя', security: [{ bearerAuth: [] }] })
    async list(
        @Req() req: RequestWithUser,
        @QueryParam('status') status: RentalStatus,
        @QueryParam('role') role: 'renter' | 'landlord',
        @QueryParam('page') page: number = 1,
        @QueryParam('page_size') pageSize: number = 20,
        @Res() res: Response,
    ) {
        const repo = dataSource.getRepository(Rental);
        const qb = repo.createQueryBuilder('r');

        if (role === 'landlord') {
            qb.where('r.ownerId = :uid', { uid: req.user.id });
        } else {
            qb.where('r.renterId = :uid', { uid: req.user.id });
        }

        if (status) qb.andWhere('r.status = :status', { status });
        qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);

        const [items, total] = await qb.getManyAndCount();

        return res.json({
            items: items.map((r) => ({
                id: r.id, property_id: r.propertyId,
                agreed_price: r.agreedPrice, currency: r.currency,
                start_date: r.startDate, end_date: r.endDate ?? null, status: r.status,
            })),
            total,
        });
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создать заявку на аренду', security: [{ bearerAuth: [] }] })
    async create(@Req() req: RequestWithUser, @Body({ type: CreateRentalDto }) dto: CreateRentalDto, @Res() res: Response) {
        const property = await fetchProperty(dto.property_id);
        if (!property) return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
        if (property.owner_id === req.user.id) return res.status(400).json({ code: 'CANNOT_RENT_OWN_PROPERTY', message: 'Нельзя арендовать свой объект' });
        if (property.status === 'rented') return res.status(409).json({ code: 'PROPERTY_ALREADY_RENTED', message: 'Объект уже арендован' });
        if (property.status === 'archived') return res.status(409).json({ code: 'PROPERTY_NOT_AVAILABLE', message: 'Объект недоступен' });

        const repo = dataSource.getRepository(Rental);
        const rental = repo.create({
            propertyId: dto.property_id, renterId: req.user.id, ownerId: property.owner_id,
            agreedPrice: dto.agreed_price, currency: property.currency,
            depositAmount: dto.deposit_amount ?? null,
            startDate: dto.start_date, endDate: dto.end_date ?? null,
            status: RentalStatus.PENDING,
        });
        await repo.save(rental);
        return res.status(201).json(await this._buildDetail(rental.id));
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Детали аренды', security: [{ bearerAuth: [] }] })
    async getById(@Param('id') id: number, @Req() req: RequestWithUser, @Res() res: Response) {
        const rental = await dataSource.getRepository(Rental).findOne({ where: { id }, relations: ['transactions'] });
        if (!rental) return res.status(404).json({ code: 'NOT_FOUND', message: 'Аренда не найдена' });
        if (rental.renterId !== req.user.id && rental.ownerId !== req.user.id) {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
        }
        return res.json(await this._buildDetail(id));
    }

    @Patch('/:id/status')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Изменить статус аренды', security: [{ bearerAuth: [] }] })
    async updateStatus(@Param('id') id: number, @Req() req: RequestWithUser, @Body({ type: UpdateRentalStatusDto }) dto: UpdateRentalStatusDto, @Res() res: Response) {
        const repo = dataSource.getRepository(Rental);
        const rental = await repo.findOneBy({ id });
        if (!rental) return res.status(404).json({ code: 'NOT_FOUND', message: 'Аренда не найдена' });
        if (rental.renterId !== req.user.id && rental.ownerId !== req.user.id) {
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
        }

        const allowed = VALID_TRANSITIONS[rental.status];
        if (!allowed.includes(dto.status)) {
            return res.status(422).json({ code: 'INVALID_STATUS_TRANSITION', message: 'Недопустимый переход статуса' });
        }

        rental.status = dto.status;
        if (dto.cancel_reason) rental.cancelReason = dto.cancel_reason;
        if (dto.status === RentalStatus.CANCELLED) rental.cancelledAt = new Date();
        await repo.save(rental);

        if (dto.status === RentalStatus.ACTIVE) {
            await publishRentalStatusChanged(rental.id, rental.propertyId, 'rented');
        } else if (dto.status === RentalStatus.COMPLETED || dto.status === RentalStatus.CANCELLED) {
            await publishRentalStatusChanged(rental.id, rental.propertyId, 'active');
        }

        return res.json(await this._buildDetail(id));
    }

    private async _buildDetail(rentalId: number) {
        const rental = await dataSource.getRepository(Rental).findOne({ where: { id: rentalId }, relations: ['transactions'] });
        if (!rental) return null;

        const [property, renter] = await Promise.all([
            fetchProperty(rental.propertyId),
            fetchUser(rental.renterId),
        ]);

        return {
            id: rental.id,
            property: property ? {
                id: property.id, title: property.title, type: property.type,
                city: property.city, price_per_month: property.price_per_month,
                currency: property.currency, status: property.status,
            } : { id: rental.propertyId },
            renter: renter ? {
                id: renter.id, first_name: renter.first_name,
                last_name: renter.last_name, avatar_url: renter.avatar_url ?? null,
            } : { id: rental.renterId },
            agreed_price: rental.agreedPrice, currency: rental.currency,
            deposit_amount: rental.depositAmount ?? null,
            deposit_status: rental.depositStatus ?? null,
            start_date: rental.startDate, end_date: rental.endDate ?? null,
            status: rental.status,
            transactions: (rental.transactions ?? []).map((t) => ({
                id: t.id, type: t.type, amount: t.amount, currency: t.currency,
                status: t.status, payment_method: t.paymentMethod,
                payment_date: t.paymentDate ?? null,
                period_start: t.periodStart ?? null, period_end: t.periodEnd ?? null,
                created_at: t.createdAt,
            })),
            cancel_reason: rental.cancelReason ?? null,
            created_at: rental.createdAt,
        };
    }
}

export default RentalController;
