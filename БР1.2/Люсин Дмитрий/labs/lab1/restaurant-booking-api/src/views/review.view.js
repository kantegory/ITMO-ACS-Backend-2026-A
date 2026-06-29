const toReviewResponse = (review) => ({
  id: review.id,
  user_id: review.user_id,
  restaurant_id: review.restaurant_id,
  booking_id: review.booking_id,
  rating: review.rating,
  comment: review.comment,
  created_at: review.created_at,
  updated_at: review.updated_at,
  user: review.user ? {
    id: review.user.id,
    name: review.user.name,
  } : undefined,
});

module.exports = { toReviewResponse };
