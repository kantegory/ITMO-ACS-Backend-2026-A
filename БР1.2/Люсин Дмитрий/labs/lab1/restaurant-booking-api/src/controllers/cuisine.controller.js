const { Cuisine } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toCuisineResponse } = require('../views/cuisine.view');

const getCuisines = asyncHandler(async (req, res) => {
  const cuisines = await Cuisine.findAll({ order: [['name', 'ASC']] });
  res.json({ data: cuisines.map(toCuisineResponse) });
});

const getCuisineById = asyncHandler(async (req, res) => {
  const cuisine = await Cuisine.findByPk(req.params.cuisineId);

  if (!cuisine) {
    throw new ApiError(404, 'Кухня не найдена');
  }

  res.json({ cuisine: toCuisineResponse(cuisine) });
});

const createCuisine = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, 'Название кухни обязательно');
  }

  const existingCuisine = await Cuisine.findOne({ where: { name } });

  if (existingCuisine) {
    throw new ApiError(409, 'Такая кухня уже существует');
  }

  const cuisine = await Cuisine.create({ name });
  res.status(201).json({ cuisine: toCuisineResponse(cuisine) });
});

const updateCuisine = asyncHandler(async (req, res) => {
  const cuisine = await Cuisine.findByPk(req.params.cuisineId);

  if (!cuisine) {
    throw new ApiError(404, 'Кухня не найдена');
  }

  if (!req.body.name) {
    throw new ApiError(400, 'Название кухни обязательно');
  }

  await cuisine.update({ name: req.body.name });
  res.json({ cuisine: toCuisineResponse(cuisine) });
});

const deleteCuisine = asyncHandler(async (req, res) => {
  const cuisine = await Cuisine.findByPk(req.params.cuisineId);

  if (!cuisine) {
    throw new ApiError(404, 'Кухня не найдена');
  }

  await cuisine.destroy();
  res.status(204).send();
});

module.exports = { getCuisines, getCuisineById, createCuisine, updateCuisine, deleteCuisine };
