import { Get, Param, QueryParam, UseBefore, NotFoundError } from 'routing-controllers';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import { internalGuard } from '../../../shared/internal-client';

import dataSource from '../data-source';
import { Booking } from '../models/booking.entity';

@EntityController({ baseRoute: '/internal/bookings', entity: Booking, dataSource })
@UseBefore(internalGuard)
class BookingInternalController extends BaseController {
    @Get('/exists')
    async exists(
        @QueryParam('userId') userId: number,
        @QueryParam('propertyId') propertyId: number,
        @QueryParam('status') status: string,
    ) {
        const qb = this.repository
            .createQueryBuilder('b')
            .where('b.tenantId = :userId AND b.propertyId = :propertyId', { userId, propertyId });
        if (status) qb.andWhere('b.status = :status', { status });
        const count = await qb.getCount();
        return { exists: count > 0 };
    }

    @Get('/:id')
    async getBooking(@Param('id') id: number) {
        const b = await this.repository.findOneBy({ id });
        if (!b) throw new NotFoundError('Сделка не найдена');
        return b;
    }
}

export default BookingInternalController;
