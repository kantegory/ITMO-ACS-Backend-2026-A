import { Get, Param, QueryParam, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { JsonController } from 'routing-controllers';
import { Response } from 'express';

import serviceAuthMiddleware from '../middlewares/service-auth.middleware';
import dataSource from '../config/data-source';
import { Rental } from '../models/rental.entity';
import { RentalStatus } from '../models/enums';

@JsonController('/internal/rentals')
class InternalRentalController {
    @Get('/check')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Проверить наличие завершённой аренды (internal)' })
    async check(
        @QueryParam('renter_id') renterId: number,
        @QueryParam('owner_id') ownerId: number,
        @Res() res: Response,
    ) {
        if (!renterId || !ownerId) {
            return res.status(400).json({ code: 'BAD_REQUEST', message: "Query params 'renter_id' and 'owner_id' are required" });
        }

        const rental = await dataSource.getRepository(Rental).findOneBy({
            renterId,
            ownerId,
            status: RentalStatus.COMPLETED,
        });

        return res.json({ has_completed_rental: !!rental, rental_id: rental?.id ?? null });
    }

    @Get('/:id')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Получить данные аренды (internal)' })
    async getRental(@Param('id') id: number, @Res() res: Response) {
        const rental = await dataSource.getRepository(Rental).findOneBy({ id });
        if (!rental) return res.status(404).json({ code: 'NOT_FOUND', message: `Rental with id ${id} not found` });

        return res.json({
            id: rental.id, property_id: rental.propertyId,
            renter_id: rental.renterId, owner_id: rental.ownerId,
            status: rental.status, start_date: rental.startDate, end_date: rental.endDate ?? null,
        });
    }
}

export default InternalRentalController;
