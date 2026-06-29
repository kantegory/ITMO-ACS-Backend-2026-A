const { Review } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { reviewView } = require('../views/review.view');
const { ensureRestaurantExists, checkReviewPermission } = require('../utils/serviceClient');
const { publishEvent } = require('../utils/rabbit');

const getRestaurantReviews = asyncHandler(async (req, res) => {
  await ensureRestaurantExists(req.params.restaurantId);

  const reviews = await Review.findAll({
    where: { restaurant_id: req.params.restaurantId },
    order: [['id', 'DESC']]
  });

  res.json({ data: reviews.map(reviewView) });
});

const createReview = asyncHandler(async (req, res) => {
  await ensureRestaurantExists(req.params.restaurantId);

  const { booking_id, rating, comment } = req.body;

  if (!booking_id || !rating) {
    throw new ApiError(400, 'Необходимо указать booking_id и rating');
  }

  if (Number(rating) < 1 || Number(rating) > 5) {
    throw new ApiError(400, 'Оценка должна быть от 1 до 5');
  }

  await checkReviewPermission({ bookingId: booking_id, userId: req.user.id, restaurantId: Number(req.params.restaurantId) });

  const existing = await Review.findOne({ where: { booking_id } });

  if (existing) {
    throw new ApiError(409, 'По этому бронированию уже оставлен отзыв');
  }

  const review = await Review.create({
    user_id: req.user.id,
    restaurant_id: req.params.restaurantId,
    booking_id,
    rating,
    comment
  });

  const reviewPayload = reviewView(review);

  await publishEvent({
    type: 'ReviewCreated',
    routingKey: 'review.created',
    producer: 'review-service',
    payload: reviewPayload
  });

  res.status(201).json({ review: reviewPayload });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    throw new ApiError(404, 'Отзыв не найден');
  }

  if (req.user.role !== 'admin' && review.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому отзыву');
  }

  const previousRating = review.rating;

  if (req.body.rating !== undefined) {
    if (Number(req.body.rating) < 1 || Number(req.body.rating) > 5) {
      throw new ApiError(400, 'Оценка должна быть от 1 до 5');
    }
    review.rating = req.body.rating;
  }

  if (req.body.comment !== undefined) review.comment = req.body.comment;

  await review.save();

  const reviewPayload = reviewView(review);

  await publishEvent({
    type: 'ReviewUpdated',
    routingKey: 'review.updated',
    producer: 'review-service',
    payload: { ...reviewPayload, previous_rating: previousRating }
  });

  res.json({ review: reviewPayload });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    throw new ApiError(404, 'Отзыв не найден');
  }

  if (req.user.role !== 'admin' && review.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому отзыву');
  }

  const reviewPayload = reviewView(review);

  await review.destroy();

  await publishEvent({
    type: 'ReviewDeleted',
    routingKey: 'review.deleted',
    producer: 'review-service',
    payload: reviewPayload
  });

  res.status(204).send();
});

const getInternalReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({ where: { restaurant_id: req.params.restaurantId }, order: [['id', 'DESC']] });
  res.json({ data: reviews.map(reviewView) });
});

module.exports = { getRestaurantReviews, createReview, updateReview, deleteReview, getInternalReviews };
