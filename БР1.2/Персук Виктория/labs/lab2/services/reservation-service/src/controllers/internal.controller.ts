import { Get, JsonController, Param, QueryParam, NotFoundError } from 'routing-controllers';
import dataSource from '../config/data-source';
import { Reservation } from '../models/reservation.entity';
import { Table } from '../models/table.entity';

@JsonController('/internal')
class InternalController {
    @Get('/tables/:id')
    async getTableById(@Param('id') id: number) {
        const table = await dataSource.getRepository(Table).findOneBy({ table_id: id });
        if (!table) throw new NotFoundError('Table not found');
        return { table_id: table.table_id, restaurant_id: table.restaurant_id, capacity: table.capacity };
    }

    @Get('/tables')
    async getTablesByRestaurant(@QueryParam('restaurant_id') restaurantId: number) {
        if (!restaurantId) return { message: 'restaurant_id is required' };
        const tables = await dataSource.getRepository(Table).find({ where: { restaurant_id: restaurantId } });
        return tables;
    }

    @Get('/reservations')
    async getReservations(
        @QueryParam('restaurant_id') restaurantId: number,
        @QueryParam('user_id') userId: number,
    ) {
        if (!restaurantId && !userId) {
            return { message: 'At least one query parameter required' };
        }

        const repo = dataSource.getRepository(Reservation);

        if (userId) {
            return await repo.find({ where: { user_id: userId }, relations: ['table'] });
        }

        // reservations by restaurant: get all table IDs for that restaurant
        const tables = await dataSource.getRepository(Table).find({ where: { restaurant_id: restaurantId } });
        const tableIds = tables.map((t) => t.table_id);
        if (tableIds.length === 0) return [];

        return await repo
            .createQueryBuilder('reservation')
            .where('reservation.table_id IN (:...tableIds)', { tableIds })
            .leftJoinAndSelect('reservation.table', 'table')
            .getMany();
    }
}

export default InternalController;
