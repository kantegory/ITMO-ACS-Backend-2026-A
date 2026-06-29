const menuItemView = (item) => ({
  id: item.id,
  menu_category_id: item.menu_category_id,
  name: item.name,
  description: item.description,
  price: Number(item.price),
  is_available: item.is_available,
  created_at: item.created_at || item.createdAt,
  updated_at: item.updated_at || item.updatedAt
});

const menuCategoryView = (category) => ({
  id: category.id,
  restaurant_id: category.restaurant_id,
  name: category.name,
  items: category.items ? category.items.map(menuItemView) : undefined,
  created_at: category.created_at || category.createdAt,
  updated_at: category.updated_at || category.updatedAt
});

module.exports = { menuItemView, menuCategoryView };
