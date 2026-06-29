const { Op } = require('sequelize');
const { Booking, Restaurant, RestaurantTable, User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toBookingResponse } = require('../views/booking.view');

const bookingInclude = [
  { model: Restaurant, as: 'restaurant' },
  { model: RestaurantTable, as: 'table' },
  { model: User, as: 'user' },
];

const createBooking = asyncHandler(async (req, res) => {
  const { restaurant_id, table_id, guests_count, booking_start, booking_end } = req.body;

  if (!restaurant_id || !table_id || !guests_count || !booking_start || !booking_end) {
    throw new ApiError(400, 'Ресторан, столик, количество гостей, начало и конец бронирования обязательны');
  }

  const restaurant = await Restaurant.findByPk(restaurant_id);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const table = await RestaurantTable.findByPk(table_id);

  if (!table || table.restaurant_id !== Number(restaurant_id)) {
    throw new ApiError(404, 'Столик не найден в выбранном ресторане');
  }

  if (!table.is_active) {
    throw new ApiError(409, 'Этот столик недоступен для бронирования');
  }

  if (Number(guests_count) > table.seats_count) {
    throw new ApiError(400, 'Количество гостей превышает количество мест за столиком');
  }

  const start = new Date(booking_start);
  const end = new Date(booking_end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new ApiError(400, 'Некорректное время бронирования');
  }

  const conflict = await Booking.findOne({
    where: {
      table_id,
      status: { [Op.notIn]: ['cancelled'] },
      booking_start: { [Op.lt]: end },
      booking_end: { [Op.gt]: start },
    },
  });

  if (conflict) {
    throw new ApiError(409, 'Столик уже забронирован на выбранное время');
  }

  const booking = await Booking.create({
    user_id: req.user.id,
    restaurant_id,
    table_id,
    guests_count,
    booking_start: start,
    booking_end: end,
    status: 'pending',
  });

  const fullBooking = await Booking.findByPk(booking.id, { include: bookingInclude });
  res.status(201).json({ booking: toBookingResponse(fullBooking) });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({
    where: { user_id: req.user.id },
    include: bookingInclude,
    order: [['booking_start', 'DESC']],
  });

  res.json({ data: bookings.map(toBookingResponse) });
});

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({ include: bookingInclude, order: [['booking_start', 'DESC']] });
  res.json({ data: bookings.map(toBookingResponse) });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId, { include: bookingInclude });

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому бронированию');
  }

  res.json({ booking: toBookingResponse(booking) });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.bookingId, { include: bookingInclude });

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
    throw new ApiError(403, 'Нет доступа к этому бронированию');
  }

  await booking.update({ status: 'cancelled' });
  res.json({ booking: toBookingResponse(booking) });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, 'Некорректный статус бронирования');
  }

  const booking = await Booking.findByPk(req.params.bookingId, { include: bookingInclude });

  if (!booking) {
    throw new ApiError(404, 'Бронирование не найдено');
  }

  await booking.update({ status });
  res.json({ booking: toBookingResponse(booking) });
});

module.exports = { createBooking, getMyBookings, getBookings, getBookingById, cancelBooking, updateBookingStatus };
