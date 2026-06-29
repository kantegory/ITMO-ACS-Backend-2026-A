const { Op } = require('sequelize');
const { Restaurant, Cuisine, RestaurantPhoto } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toRestaurantResponse } = require('../views/restaurant.view');

const getRestaurants = asyncHandler(async (req, res) => {
  const {
    cuisine_id,
    city,
    district,
    price_category,
    min_average_check,
    max_average_check,
    page = 1,
    limit = 10,
  } = req.query;

  const where = {};

  if (city) where.city = { [Op.like]: `%${city}%` };
  if (district) where.district = { [Op.like]: `%${district}%` };
  if (price_category) where.price_category = price_category;

  if (min_average_check || max_average_check) {
    where.average_check = {};
    if (min_average_check) where.average_check[Op.gte] = Number(min_average_check);
    if (max_average_check) where.average_check[Op.lte] = Number(max_average_check);
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const offset = (pageNumber - 1) * limitNumber;

  const include = [
    { model: Cuisine, as: 'cuisines', through: { attributes: [] }, required: Boolean(cuisine_id), where: cuisine_id ? { id: cuisine_id } : undefined },
    { model: RestaurantPhoto, as: 'photos', required: false },
  ];

  const result = await Restaurant.findAndCountAll({
    where,
    include,
    distinct: true,
    limit: limitNumber,
    offset,
    order: [['id', 'ASC']],
  });

  res.json({
    data: result.rows.map(toRestaurantResponse),
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total: result.count,
      total_pages: Math.ceil(result.count / limitNumber),
    },
  });
});

const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId, {
    include: [
      { model: Cuisine, as: 'cuisines', through: { attributes: [] } },
      { model: RestaurantPhoto, as: 'photos' },
    ],
  });

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  res.json({ restaurant: toRestaurantResponse(restaurant) });
});

const createRestaurant = asyncHandler(async (req, res) => {
  const { name, description, address, city, district, average_check, price_category, cuisine_ids = [] } = req.body;

  if (!name || !address || !city || !average_check) {
    throw new ApiError(400, 'Название, адрес, город и средний чек обязательны');
  }

  const restaurant = await Restaurant.create({ name, description, address, city, district, average_check, price_category });

  if (Array.isArray(cuisine_ids) && cuisine_ids.length > 0) {
    const cuisines = await Cuisine.findAll({ where: { id: cuisine_ids } });
    await restaurant.setCuisines(cuisines);
  }

  const fullRestaurant = await Restaurant.findByPk(restaurant.id, {
    include: [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }],
  });

  res.status(201).json({ restaurant: toRestaurantResponse(fullRestaurant) });
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const { name, description, address, city, district, average_check, price_category, cuisine_ids } = req.body;

  await restaurant.update({
    name: name ?? restaurant.name,
    description: description ?? restaurant.description,
    address: address ?? restaurant.address,
    city: city ?? restaurant.city,
    district: district ?? restaurant.district,
    average_check: average_check ?? restaurant.average_check,
    price_category: price_category ?? restaurant.price_category,
  });

  if (Array.isArray(cuisine_ids)) {
    const cuisines = await Cuisine.findAll({ where: { id: cuisine_ids } });
    await restaurant.setCuisines(cuisines);
  }

  const fullRestaurant = await Restaurant.findByPk(restaurant.id, {
    include: [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }],
  });

  res.json({ restaurant: toRestaurantResponse(fullRestaurant) });
});

const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  await restaurant.destroy();
  res.status(204).send();
});

const addCuisineToRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId, {
    include: [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }],
  });

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const cuisineId = req.body.cuisine_id;

  if (!cuisineId) {
    throw new ApiError(400, 'ID кухни обязателен');
  }

  const cuisine = await Cuisine.findByPk(cuisineId);

  if (!cuisine) {
    throw new ApiError(404, 'Кухня не найдена');
  }

  await restaurant.addCuisine(cuisine);

  const fullRestaurant = await Restaurant.findByPk(restaurant.id, {
    include: [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }],
  });

  res.json({ restaurant: toRestaurantResponse(fullRestaurant) });
});

const removeCuisineFromRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const cuisine = await Cuisine.findByPk(req.params.cuisineId);

  if (!cuisine) {
    throw new ApiError(404, 'Кухня не найдена');
  }

  await restaurant.removeCuisine(cuisine);
  res.status(204).send();
});

module.exports = { getRestaurants, getRestaurantById, createRestaurant, updateRestaurant, deleteRestaurant, addCuisineToRestaurant, removeCuisineFromRestaurant };
