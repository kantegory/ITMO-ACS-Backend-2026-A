const { Booking, Restaurant, Review, User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toReviewResponse } = require('../views/review.view');

const reviewInclude = [{ model: User, as: 'user' }];

const getRestaurantReviews = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const reviews = await Review.findAll({
    where: { restaurant_id: restaurant.id },
    include: reviewInclude,
    order: [['created_at', 'DESC']],
  });

  res.json({ data: reviews.map(toReviewResponse) });
});

const createReview = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const { booking_id, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Оценка должна быть от 1 до 5');
  }

  if (booking_id) {
    const booking = await Booking.findByPk(booking_id);

    if (!booking || booking.user_id !== req.user.id || booking.restaurant_id !== restaurant.id) {
      throw new ApiError(403, 'Нельзя оставить отзыв по этому бронированию');
    }

    const existingReview = await Review.findOne({ where: { booking_id } });

    if (existingReview) {
      throw new ApiError(409, 'По этому бронированию уже оставлен отзыв');
    }
  }

  const review = await Review.create({
    user_id: req.user.id,
    restaurant_id: restaurant.id,
    booking_id: booking_id || null,
    rating,
    comment,
  });

  const fullReview = await Review.findByPk(review.id, { include: reviewInclude });
  res.status(201).json({ review: toReviewResponse(fullReview) });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId, { include: reviewInclude });

  if (!review) {
    throw new ApiError(404, 'Отзыв не найден');
  }

  if (req.user.role !== 'admin' && review.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому отзыву');
  }

  const { rating, comment } = req.body;

  if (rating && (rating < 1 || rating > 5)) {
    throw new ApiError(400, 'Оценка должна быть от 1 до 5');
  }

  await review.update({
    rating: rating ?? review.rating,
    comment: comment ?? review.comment,
  });

  res.json({ review: toReviewResponse(review) });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.reviewId);

  if (!review) {
    throw new ApiError(404, 'Отзыв не найден');
  }

  if (req.user.role !== 'admin' && review.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому отзыву');
  }

  await review.destroy();
  res.status(204).send();
});

module.exports = { getRestaurantReviews, createReview, updateReview, deleteReview };
