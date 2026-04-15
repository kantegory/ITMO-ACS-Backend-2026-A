const { Op } = require('sequelize');
const {
  Restaurant,
  MenuItem,
  RestaurantPhoto,
  Review,
  User,
  Reservation
} = require('../models');

exports.getAll = async (req, res) => {
  const { cuisine, city, priceMin, priceMax } = req.query;
  const where = {};

  if (cuisine) where.cuisine = cuisine;
  if (city) where.city = city;
  if (priceMin || priceMax) {
    where.average_check = {};
    if (priceMin) where.average_check[Op.gte] = Number(priceMin);
    if (priceMax) where.average_check[Op.lte] = Number(priceMax);
  }

  const restaurants = await Restaurant.findAll({
    where,
    attributes: ['id', 'name', 'cuisine', 'city', 'address', 'average_check']
  });

  return res.json(restaurants);
};

exports.getById = async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.id, {
    include: [
      { model: MenuItem, attributes: ['id', 'name', 'price'] },
      { model: RestaurantPhoto, attributes: ['id', 'url'] },
      {
        model: Review,
        attributes: ['id', 'rating', 'text', 'createdAt'],
        include: [{ model: User, attributes: ['id', 'name'] }]
      }
    ]
  });

  if (!restaurant) {
    return res.status(404).json({ error: 'restaurant not found' });
  }

  return res.json(restaurant);
};

exports.createReservation = async (req, res) => {
  const { guests_count, reservation_datetime } = req.body;

  if (!guests_count || !reservation_datetime) {
    return res.status(400).json({ error: 'guests_count and reservation_datetime are required' });
  }

  const restaurant = await Restaurant.findByPk(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ error: 'restaurant not found' });
  }

  const reservation = await Reservation.create({
    guests_count,
    reservation_datetime,
    UserId: req.user.id,
    RestaurantId: restaurant.id
  });

  return res.status(201).json(reservation);
};