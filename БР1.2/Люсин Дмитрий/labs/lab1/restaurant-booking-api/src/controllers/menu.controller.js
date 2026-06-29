const { Restaurant, MenuCategory, MenuItem } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toMenuCategoryResponse, toMenuItemResponse } = require('../views/menu.view');

const getRestaurantMenu = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  const categories = await MenuCategory.findAll({
    where: { restaurant_id: restaurant.id },
    include: [{ model: MenuItem, as: 'items' }],
    order: [['id', 'ASC']],
  });

  res.json({ data: categories.map(toMenuCategoryResponse) });
});

const createMenuCategory = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByPk(req.params.restaurantId);

  if (!restaurant) {
    throw new ApiError(404, 'Ресторан не найден');
  }

  if (!req.body.name) {
    throw new ApiError(400, 'Название категории обязательно');
  }

  const category = await MenuCategory.create({ restaurant_id: restaurant.id, name: req.body.name });
  res.status(201).json({ category: toMenuCategoryResponse(category) });
});

const updateMenuCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByPk(req.params.categoryId);

  if (!category) {
    throw new ApiError(404, 'Категория меню не найдена');
  }

  await category.update({ name: req.body.name ?? category.name });
  res.json({ category: toMenuCategoryResponse(category) });
});

const deleteMenuCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByPk(req.params.categoryId);

  if (!category) {
    throw new ApiError(404, 'Категория меню не найдена');
  }

  await category.destroy();
  res.status(204).send();
});

const createMenuItem = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByPk(req.params.categoryId);

  if (!category) {
    throw new ApiError(404, 'Категория меню не найдена');
  }

  const { name, description, price, is_available = true } = req.body;

  if (!name || !price) {
    throw new ApiError(400, 'Название блюда и цена обязательны');
  }

  const item = await MenuItem.create({ menu_category_id: category.id, name, description, price, is_available });
  res.status(201).json({ item: toMenuItemResponse(item) });
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByPk((req.params.itemId || req.params.menuItemId));

  if (!item) {
    throw new ApiError(404, 'Блюдо не найдено');
  }

  const { name, description, price, is_available } = req.body;

  await item.update({
    name: name ?? item.name,
    description: description ?? item.description,
    price: price ?? item.price,
    is_available: is_available ?? item.is_available,
  });

  res.json({ item: toMenuItemResponse(item) });
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByPk((req.params.itemId || req.params.menuItemId));

  if (!item) {
    throw new ApiError(404, 'Блюдо не найдено');
  }

  await item.destroy();
  res.status(204).send();
});

module.exports = {
  getRestaurantMenu,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
