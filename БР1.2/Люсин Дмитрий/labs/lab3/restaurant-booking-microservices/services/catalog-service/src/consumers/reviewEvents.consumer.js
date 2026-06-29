const { Restaurant } = require('../models');
const { startConsumer } = require('../utils/rabbit');

const roundRating = (value) => Math.round(value * 100) / 100;

const saveRating = async (restaurant, ratingSum, reviewsCount) => {
  const safeReviewsCount = Math.max(0, reviewsCount);
  const safeRatingSum = Math.max(0, ratingSum);

  restaurant.reviews_count = safeReviewsCount;
  restaurant.rating_sum = safeRatingSum;
  restaurant.average_rating = safeReviewsCount === 0 ? 0 : roundRating(safeRatingSum / safeReviewsCount);

  await restaurant.save();
};

const handleReviewCreated = async (payload) => {
  const restaurant = await Restaurant.findByPk(payload.restaurant_id);
  if (!restaurant) return;

  await saveRating(
    restaurant,
    Number(restaurant.rating_sum) + Number(payload.rating),
    Number(restaurant.reviews_count) + 1
  );
};

const handleReviewUpdated = async (payload) => {
  const restaurant = await Restaurant.findByPk(payload.restaurant_id);
  if (!restaurant) return;

  await saveRating(
    restaurant,
    Number(restaurant.rating_sum) - Number(payload.previous_rating) + Number(payload.rating),
    Number(restaurant.reviews_count)
  );
};

const handleReviewDeleted = async (payload) => {
  const restaurant = await Restaurant.findByPk(payload.restaurant_id);
  if (!restaurant) return;

  await saveRating(
    restaurant,
    Number(restaurant.rating_sum) - Number(payload.rating),
    Number(restaurant.reviews_count) - 1
  );
};

const handleEvent = async (event, routingKey) => {
  if (routingKey === 'review.created') await handleReviewCreated(event.payload);
  if (routingKey === 'review.updated') await handleReviewUpdated(event.payload);
  if (routingKey === 'review.deleted') await handleReviewDeleted(event.payload);

  console.log(`Catalog Service processed event: ${routingKey}`);
};

const startReviewEventsConsumer = async () => startConsumer({
  queue: 'catalog-service.review-events',
  bindings: ['review.created', 'review.updated', 'review.deleted'],
  handler: handleEvent
});

module.exports = { startReviewEventsConsumer };
