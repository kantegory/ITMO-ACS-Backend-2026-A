const bookingView = (booking) => {
  if (!booking) return null;

  return {
    id: booking.id,
    user_id: booking.user_id,
    restaurant_id: booking.restaurant_id,
    table_id: booking.table_id,
    guests_count: booking.guests_count,
    booking_start: booking.booking_start,
    booking_end: booking.booking_end,
    status: booking.status,
    created_at: booking.created_at || booking.createdAt,
    updated_at: booking.updated_at || booking.updatedAt
  };
};

module.exports = { bookingView };
