import {
    Body,
    Get,
    NotFoundError,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Payment } from '../models/payment.entity';
import { Booking } from '../models/booking.entity';

@EntityController({
    baseRoute: '/payments',
    entity: Payment,
})
class PaymentsController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    async create(
        @Req() request: RequestWithUser,
        @Body() body: { booking_id: number; amount: number },
    ): Promise<{ id: number }> {
        const { user } = request;

        const bookingRepo = dataSource.getRepository(Booking);
        const booking = await bookingRepo.findOneBy({ id: body.booking_id });
        if (!booking) throw new NotFoundError('Booking not found');
        if (booking.tenant_id !== user.id) throw new NotFoundError('Booking not found');

        const created = this.repository.create({
            booking_id: body.booking_id,
            amount: body.amount,
            status: 'created',
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Get('/my')
    async my(@Req() request: RequestWithUser): Promise<Payment[]> {
        const { user } = request;

        return await this.repository
            .createQueryBuilder('p')
            .innerJoin(Booking, 'b', 'b.id = p.booking_id')
            .where('b.tenant_id = :tenant_id', { tenant_id: user.id })
            .getMany();
    }
}

export default PaymentsController;

