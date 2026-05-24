import { Get, Patch, JsonController, Param, QueryParam, NotFoundError, Body } from 'routing-controllers';
import { In } from 'typeorm';
import dataSource from '../config/data-source';
import { Restaurant } from '../models/restaurant.entity';

@JsonController('/internal')
class InternalController {
    private get repo() {
        return dataSource.getRepository(Restaurant);
    }

    @Get('/restaurants/:id')
    async getRestaurantById(@Param('id') id: number) {
        const restaurant = await this.repo.findOneBy({ restaurant_id: id });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }
        return {
            restaurant_id: restaurant.restaurant_id,
            name: restaurant.name,
            status: restaurant.status,
            city: restaurant.city,
        };
    }

    @Get('/restaurants')
    async getRestaurantsByIds(@QueryParam('ids') ids: string) {
        if (!ids) {
            return { message: 'ids parameter is required' };
        }
        const idList = ids.split(',').map(Number).filter(Boolean);
        const restaurants = await this.repo.find({ where: { restaurant_id: In(idList) } });
        return restaurants.map((r) => ({
            restaurant_id: r.restaurant_id,
            name: r.name,
            status: r.status,
            city: r.city,
        }));
    }

    @Patch('/restaurants/:id/rating')
    async updateRating(@Param('id') id: number, @Body() body: { rating: number }) {
        const { rating } = body;
        if (rating === undefined || rating === null) {
            return { message: 'Invalid rating value' };
        }

        const restaurant = await this.repo.findOneBy({ restaurant_id: id });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        await this.repo.update({ restaurant_id: id }, { rating });
        return { restaurant_id: id, rating };
    }
}

export default InternalController;
