const { MenuCategory, MenuItem } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ensureRestaurantExists } = require('../utils/serviceClient');
const { menuCategoryView, menuItemView } = require('../views/menu.view');

const getMenu = asyncHandler(async (req, res) => {
  await ensureRestaurantExists(req.params.restaurantId);

  const categories = await MenuCategory.findAll({
    where: { restaurant_id: req.params.restaurantId },
    include: [{ model: MenuItem, as: 'items' }],
    order: [['id', 'ASC'], [{ model: MenuItem, as: 'items' }, 'id', 'ASC']]
  });

  res.json({ data: categories.map(menuCategoryView) });
});

const createCategory = asyncHandler(async (req, res) => {
  await ensureRestaurantExists(req.params.restaurantId);

  if (!req.body.name) {
    throw new ApiError(400, 'Необходимо указать название категории');
  }

  const category = await MenuCategory.create({ restaurant_id: req.params.restaurantId, name: req.body.name });
  res.status(201).json({ category: menuCategoryView(category) });
});

const createItem = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByPk(req.params.categoryId);

  if (!category) {
    throw new ApiError(404, 'Категория меню не найдена');
  }

  const { name, description, price } = req.body;

  if (!name || !price) {
    throw new ApiError(400, 'Необходимо указать name и price');
  }

  const item = await MenuItem.create({ menu_category_id: category.id, name, description, price });

  res.status(201).json({ item: menuItemView(item) });
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByPk(req.params.itemId);

  if (!item) {
    throw new ApiError(404, 'Блюдо не найдено');
  }

  for (const field of ['name', 'description', 'price', 'is_available']) {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  }

  await item.save();

  res.json({ item: menuItemView(item) });
});

const deleteItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByPk(req.params.itemId);

  if (!item) {
    throw new ApiError(404, 'Блюдо не найдено');
  }

  await item.destroy();

  res.status(204).send();
});

module.exports = { getMenu, createCategory, createItem, updateItem, deleteItem };
