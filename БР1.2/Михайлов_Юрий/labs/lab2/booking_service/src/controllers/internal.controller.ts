import { JsonController, Get, Param, NotFoundError, Body, Post } from 'routing-controllers';
import dataSource from '../config/data-source';
import { Booking } from '../models/booking.entity';

class CheckBookingDto {
    booking_id: number;
    tenant_id: number;
}

@JsonController('/internal')
export class InternalBookingController {

    // Проверить существование бронирования
    @Get('/bookings/:id')
    async getBooking(@Param('id') id: number) {
        const bookingRepo = dataSource.getRepository(Booking);
        const booking = await bookingRepo.findOneBy({ id });

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        return {
            id: booking.id,
            property_id: booking.property_id,
            tenant_id: booking.tenant_id,
            status: booking.status,
        };
    }

    @Post('/bookings/verify')
    async verifyBooking(@Body() body: CheckBookingDto) {
        const bookingRepo = dataSource.getRepository(Booking);
        const booking = await bookingRepo.findOneBy({ id: body.booking_id });

        if (!booking) {
            return { valid: false, error: 'Booking not found' };
        }

        if (booking.tenant_id !== body.tenant_id) {
            return { valid: false, error: 'Booking does not belong to user' };
        }

        return {
            valid: true,
            booking: {
                id: booking.id,
                property_id: booking.property_id,
                tenant_id: booking.tenant_id,
                status: booking.status,
            }
        };
    }

    @Get('/bookings/:id/exists')
    async checkBookingExists(@Param('id') id: number) {
        const bookingRepo = dataSource.getRepository(Booking);
        const booking = await bookingRepo.findOneBy({ id });
        return { exists: !!booking };
    }

    @Get('/users/:userId/bookings')
    async getUserBookings(@Param('userId') userId: number) {
        const bookingRepo = dataSource.getRepository(Booking);
        const bookings = await bookingRepo.find({
            where: { tenant_id: userId },
            select: ['id', 'property_id', 'tenant_id', 'status', 'start_date', 'end_date']
        });

        return bookings;
    }
}
