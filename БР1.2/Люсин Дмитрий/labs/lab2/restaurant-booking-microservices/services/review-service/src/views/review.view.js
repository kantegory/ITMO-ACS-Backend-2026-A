const reviewView = (review) => {
  if (!review) return null;

  return {
    id: review.id,
    user_id: review.user_id,
    restaurant_id: review.restaurant_id,
    booking_id: review.booking_id,
    rating: review.rating,
    comment: review.comment,
    created_at: review.created_at || review.createdAt,
    updated_at: review.updated_at || review.updatedAt
  };
};

module.exports = { reviewView };
