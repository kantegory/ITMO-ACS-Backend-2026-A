const { Restaurant, RestaurantTable } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toTableResponse } = require('../views/table.view');

const getRestaurantTables = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const tables = await RestaurantTable.findAll({ where: { restaurant_id: restaurant.id }, order: [['id', 'ASC']] });
  res.json({ data: tables.map(toTableResponse) });
});

const createTable = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const { table_number, seats_count, is_active = true } = req.body;

  if (!table_number || !seats_count) {
    throw new ApiError(400, 'Номер столика и количество мест обязательны');
  }

  const table = await RestaurantTable.create({ restaurant_id: restaurant.id, table_number, seats_count, is_active });
  res.status(201).json({ table: toTableResponse(table) });
});

const updateTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findByPk(req.params.tableId);

  if (!table) {
    throw new ApiError(404, 'Столик не найден');
  }

  const { table_number, seats_count, is_active } = req.body;

  await table.update({
    table_number: table_number ?? table.table_number,
    seats_count: seats_count ?? table.seats_count,
    is_active: is_active ?? table.is_active,
  });

  res.json({ table: toTableResponse(table) });
});

const deleteTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findByPk(req.params.tableId);

  if (!table) {
    throw new ApiError(404, 'Столик не найден');
  }

  await table.destroy();
  res.status(204).send();
});

module.exports = { getRestaurantTables, createTable, updateTable, deleteTable };
