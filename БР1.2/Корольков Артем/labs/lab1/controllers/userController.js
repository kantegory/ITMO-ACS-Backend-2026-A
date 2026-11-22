const { Reservation, Restaurant } = require('../models');

exports.me = async (req, res) => {
  return res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
};

exports.myReservationHistory = async (req, res) => {
  const reservations = await Reservation.findAll({
    where: { UserId: req.user.id },
    include: [{ model: Restaurant }],
    order: [['reservation_datetime', 'DESC']]
  });

  return res.json(reservations);
};
