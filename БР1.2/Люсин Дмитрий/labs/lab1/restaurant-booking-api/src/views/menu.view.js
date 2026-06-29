const toMenuCategoryResponse = (category) => ({
  id: category.id,
  restaurant_id: category.restaurant_id,
  name: category.name,
  items: category.items ? category.items.map((item) => toMenuItemResponse(item)) : undefined,
});

const toMenuItemResponse = (item) => ({
  id: item.id,
  menu_category_id: item.menu_category_id,
  name: item.name,
  description: item.description,
  price: Number(item.price),
  is_available: item.is_available,
});

module.exports = { toMenuCategoryResponse, toMenuItemResponse };
