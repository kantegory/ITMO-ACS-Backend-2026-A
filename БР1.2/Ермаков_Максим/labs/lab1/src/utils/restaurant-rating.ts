import dataSource from '../config/data-source';
import { Restaurant } from '../models/restaurant.entity';
import { Review } from '../models/review.entity';

export const recalculateRestaurantRating = async (restaurantId: string) => {
    const reviewRepository = dataSource.getRepository(Review);
    const restaurantRepository = dataSource.getRepository(Restaurant);

    const reviews = await reviewRepository.find({
        where: {
            restaurant: {
                id: restaurantId,
            },
        },
    });

    const avgRating =
        reviews.length === 0
            ? 0
            : Number(
                  (
                      reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
                      reviews.length
                  ).toFixed(2),
              );

    await restaurantRepository.update(restaurantId, { avgRating });
};
