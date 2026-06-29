const { Op } = require('sequelize');
const { Booking } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { bookingView } = require('../views/booking.view');
const { ensureUserExists, getTable } = require('../utils/serviceClient');
const { publishEvent } = require('../utils/rabbit');

const validateBookingInput = ({ restaurant_id, table_id, guests_count, booking_start, booking_end }) => {
  if (!restaurant_id || !table_id || !guests_count || !booking_start || !booking_end) {
    throw new ApiError(400, 'Необходимо указать restaurant_id, table_id, guests_count, booking_start и booking_end');
  }

  const start = new Date(booking_start);
  const end = new Date(booking_end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new ApiError(400, 'Некорректный интервал бронирования');
  }

  if (Number(guests_count) <= 0) {
    throw new ApiError(400, 'Количество гостей должно быть больше нуля');
  }
};

const findConflict = async ({ restaurant_id, table_id, booking_start, booking_end, excludeId = null }) => {
  const where = {
    restaurant_id,
    table_id,
    status: { [Op.notIn]: ['cancelled'] },
    booking_start: { [Op.lt]: new Date(booking_end) },
    booking_end: { [Op.gt]: new Date(booking_start) }
  };

  if (excludeId) where.id = { [Op.ne]: excludeId };

  return Booking.findOne({ where });
};

const createBookingForUser = async ({ user_id, restaurant_id, table_id, guests_count, booking_start, booking_end, status = 'pending' }) => {
  validateBookingInput({ restaurant_id, table_id, guests_count, booking_start, booking_end });
  await ensureUserExists(user_id);

  const table = await getTable(restaurant_id, table_id);

  if (Number(guests_count) > Number(table.seats_count)) {
    throw new ApiError(400, 'Количество гостей превышает количество мест за столиком');
  }

  const conflict = await findConflict({ restaurant_id, table_id, booking_start, booking_end });

  if (conflict) {
    throw new ApiError(409, 'Столик уже забронирован на выбранное время');
  }

  return Booking.create({ user_id, restaurant_id, table_id, guests_count, booking_start, booking_end, status });
};

const createBooking = asyncHandler(async (req, res) => {
  const booking = await createBookingForUser({
    user_id: req.user.id,
    restaurant_id: req.body.restaurant_id,
    table_id: req.body.table_id,
    guests_count: req.body.guests_count,
    booking_start: req.body.booking_start,
    booking_end: req.body.booking_end
  });

  const bookingPayload = bookingView(booking);

  await publishEvent({
    type: 'BookingCreated',
    routingKey: 'booking.created',
    producer: 'booking-service',
    payload: bookingPayload
  });

  res.status(201).json({ booking: bookingPayload });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({ where: { user_id: req.user.id }, order: [['id', 'DESC']] });
  res.json({ data: bookings.map(bookingView) });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому бронированию');
  }

  res.json({ booking: bookingView(booking) });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому бронированию');
  }

  if (booking.status === 'cancelled') {
    throw new ApiError(409, 'Бронирование уже отменено');
  }

  const previousStatus = booking.status;

  booking.status = 'cancelled';
  await booking.save();

  const bookingPayload = bookingView(booking);

  await publishEvent({
    type: 'BookingCancelled',
    routingKey: 'booking.cancelled',
    producer: 'booking-service',
    payload: { ...bookingPayload, previous_status: previousStatus }
  });

  res.json({ booking: bookingPayload });
});

const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({ order: [['id', 'DESC']] });
  res.json({ data: bookings.map(bookingView) });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];

  if (!allowed.includes(req.body.status)) {
    throw new ApiError(400, 'Недопустимый статус бронирования');
  }

  const previousStatus = booking.status;

  booking.status = req.body.status;
  await booking.save();

  const bookingPayload = bookingView(booking);

  await publishEvent({
    type: 'BookingStatusChanged',
    routingKey: 'booking.status_changed',
    producer: 'booking-service',
    payload: { ...bookingPayload, previous_status: previousStatus }
  });

  res.json({ booking: bookingPayload });
});

const checkAvailability = asyncHandler(async (req, res) => {
  validateBookingInput(req.body);
  const conflict = await findConflict(req.body);
  res.json({ available: !conflict });
});

const createInternalBooking = asyncHandler(async (req, res) => {
  const booking = await createBookingForUser(req.body);
  const bookingPayload = bookingView(booking);

  await publishEvent({
    type: 'BookingCreated',
    routingKey: 'booking.created',
    producer: 'booking-service',
    payload: bookingPayload
  });

  res.status(201).json({ booking: bookingPayload });
});

const getInternalBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  res.json(bookingView(booking));
});

const checkReviewPermission = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId);

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  const userId = Number(req.query.user_id);
  const restaurantId = Number(req.query.restaurant_id);

  if (booking.user_id !== userId || booking.restaurant_id !== restaurantId) {
    throw new ApiError(403, 'Пользователь не может оставить отзыв по этому бронированию');
  }

  if (!['confirmed', 'completed', 'cancelled'].includes(booking.status)) {
    throw new ApiError(403, 'Отзыв можно оставить только после подтверждения бронирования');
  }

  res.json({ allowed: true, booking: bookingView(booking) });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBooking,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  checkAvailability,
  createInternalBooking,
  getInternalBooking,
  checkReviewPermission
};
