export const REVIEW_RATING_RECALCULATED = 'review.rating.recalculated';

export type RestaurantRatingRecalculatedEvent = {
    eventId: string;
    occurredAt: string;
    source: 'review-service';
    restaurantId: string;
    avgRating: number;
    reviewsCount: number;
};
