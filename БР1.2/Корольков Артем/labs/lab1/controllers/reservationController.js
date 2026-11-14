const { Reservation, Restaurant } = require('../models');

exports.create = async (req, res) => {
  const { restaurant_id, guests_count, reservation_datetime } = req.body;

  if (!restaurant_id || !guests_count || !reservation_datetime) {
    return res.status(400).json({ error: 'restaurant_id, guests_count and reservation_datetime are required' });
  }

  const reservation = await Reservation.create({
    RestaurantId: restaurant_id,
    UserId: req.user.id,
    guests_count,
    reservation_datetime
  });
  return res.status(201).json(reservation);
};

exports.getAll = async (req, res) => {
  const reservations = await Reservation.findAll({
    where: { UserId: req.user.id },
    include: [{ model: Restaurant }],
    order: [['reservation_datetime', 'DESC']]
  });
  return res.json(reservations);
};