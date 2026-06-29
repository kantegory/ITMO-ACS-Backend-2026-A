const { Op } = require('sequelize');
const { Restaurant, Cuisine, RestaurantTable } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { restaurantView, cuisineView } = require('../views/restaurant.view');
const { tableView } = require('../views/table.view');

const getRestaurants = asyncHandler(async (req, res) => {
  const where = { is_active: true };
  const include = [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }];

  if (req.query.city) where.city = req.query.city;
  if (req.query.district) where.district = req.query.district;
  if (req.query.price_category) where.price_category = req.query.price_category;

  if (req.query.min_average_check || req.query.max_average_check) {
    where.average_check = {};
    if (req.query.min_average_check) where.average_check[Op.gte] = Number(req.query.min_average_check);
    if (req.query.max_average_check) where.average_check[Op.lte] = Number(req.query.max_average_check);
  }

  if (req.query.cuisine_id) {
    include[0].where = { id: Number(req.query.cuisine_id) };
  }

  const restaurants = await Restaurant.findAll({ where, include, order: [['id', 'ASC']] });

  res.json({ data: restaurants.map(restaurantView) });
});

const getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId, {
    include: [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }]
  });

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  res.json({ restaurant: restaurantView(restaurant) });
});

const createRestaurant = asyncHandler(async (req, res) => {
  const { name, description, address, city, district, average_check, price_category, cuisine_ids = [] } = req.body;

  if (!name || !description || !address || !city || !average_check || !price_category) {
    throw new ApiError(400, 'Заполнены не все обязательные поля ресторана');
  }

  const restaurant = await Restaurant.create({ name, description, address, city, district, average_check, price_category });

  if (Array.isArray(cuisine_ids) && cuisine_ids.length > 0) {
    const cuisines = await Cuisine.findAll({ where: { id: cuisine_ids } });
    await restaurant.setCuisines(cuisines);
  }

  const created = await Restaurant.findByPk(restaurant.id, {
    include: [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }]
  });

  res.status(201).json({ restaurant: restaurantView(created) });
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const allowed = ['name', 'description', 'address', 'city', 'district', 'average_check', 'price_category'];

  for (const field of allowed) {
    if (req.body[field] !== undefined) restaurant[field] = req.body[field];
  }

  await restaurant.save();

  if (Array.isArray(req.body.cuisine_ids)) {
    const cuisines = await Cuisine.findAll({ where: { id: req.body.cuisine_ids } });
    await restaurant.setCuisines(cuisines);
  }

  const updated = await Restaurant.findByPk(restaurant.id, {
    include: [{ model: Cuisine, as: 'cuisines', through: { attributes: [] } }]
  });

  res.json({ restaurant: restaurantView(updated) });
});

const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  restaurant.is_active = false;
  await restaurant.save();

  res.status(204).send();
});

const getCuisines = asyncHandler(async (req, res) => {
  const cuisines = await Cuisine.findAll({ order: [['id', 'ASC']] });
  res.json({ data: cuisines.map(cuisineView) });
});

const createCuisine = asyncHandler(async (req, res) => {
  if (!req.body.name) {
    throw new ApiError(400, 'Необходимо указать название кухни');
  }

  const existing = await Cuisine.findOne({ where: { name: req.body.name } });

  if (existing) {
    throw new ApiError(409, 'Такая кухня уже существует');
  }

  const cuisine = await Cuisine.create({ name: req.body.name });
  res.status(201).json({ cuisine: cuisineView(cuisine) });
});

const getTables = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const tables = await RestaurantTable.findAll({
    where: { restaurant_id: restaurant.id, is_active: true },
    order: [['id', 'ASC']]
  });

  res.json({ data: tables.map(tableView) });
});

const createTable = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const { table_number, seats_count } = req.body;

  if (!table_number || !seats_count) {
    throw new ApiError(400, 'Необходимо указать table_number и seats_count');
  }

  const table = await RestaurantTable.create({ restaurant_id: restaurant.id, table_number, seats_count });

  res.status(201).json({ table: tableView(table) });
});

const updateTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findOne({ where: { id: req.params.tableId, restaurant_id: req.params.restaurantId } });

  if (!table || !table.is_active) {
    throw new ApiError(404, 'Столик не найден');
  }

  if (req.body.table_number !== undefined) table.table_number = req.body.table_number;
  if (req.body.seats_count !== undefined) table.seats_count = req.body.seats_count;
  if (req.body.is_active !== undefined) table.is_active = req.body.is_active;

  await table.save();

  res.json({ table: tableView(table) });
});

const deleteTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findOne({ where: { id: req.params.tableId, restaurant_id: req.params.restaurantId } });

  if (!table || !table.is_active) {
    throw new ApiError(404, 'Столик не найден');
  }

  table.is_active = false;
  await table.save();

  res.status(204).send();
});

const getInternalRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  res.json(restaurantView(restaurant));
});

const checkRestaurantExists = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant || !restaurant.is_active) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  res.json({ exists: true, restaurant_id: restaurant.id, is_active: restaurant.is_active });
});

const getInternalTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findOne({
    where: {
      id: req.params.tableId,
      restaurant_id: req.params.restaurantId,
      is_active: true
    }
  });

  if (!table) {
    throw new ApiError(404, 'Столик не найден');
  }

  res.json(tableView(table));
});

module.exports = {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getCuisines,
  createCuisine,
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getInternalRestaurant,
  checkRestaurantExists,
  getInternalTable
};
