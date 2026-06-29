const toBookingResponse = (booking) => ({
  id: booking.id,
  user_id: booking.user_id,
  restaurant_id: booking.restaurant_id,
  table_id: booking.table_id,
  guests_count: booking.guests_count,
  booking_start: booking.booking_start,
  booking_end: booking.booking_end,
  status: booking.status,
  created_at: booking.created_at,
  updated_at: booking.updated_at,
  restaurant: booking.restaurant ? {
    id: booking.restaurant.id,
    name: booking.restaurant.name,
    address: booking.restaurant.address,
    city: booking.restaurant.city,
  } : undefined,
  table: booking.table ? {
    id: booking.table.id,
    table_number: booking.table.table_number,
    seats_count: booking.table.seats_count,
  } : undefined,
  user: booking.user ? {
    id: booking.user.id,
    name: booking.user.name,
    email: booking.user.email,
  } : undefined,
});

module.exports = { toBookingResponse };
