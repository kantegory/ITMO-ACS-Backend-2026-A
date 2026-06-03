import { Get, JsonController, QueryParam } from 'routing-controllers';
import dataSource from '../config/data-source';
import { Review } from '../models/review.entity';

@JsonController('/internal')
class InternalController {
    @Get('/reviews')
    async getReviews(@QueryParam('restaurant_id') restaurantId: number) {
        if (!restaurantId) {
            return { message: 'restaurant_id is required' };
        }
        return await dataSource.getRepository(Review).find({
            where: { restaurant_id: restaurantId },
        });
    }
}

export default InternalController;
