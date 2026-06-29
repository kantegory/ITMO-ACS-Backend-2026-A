const cuisineView = (cuisine) => ({ id: cuisine.id, name: cuisine.name });

const restaurantView = (restaurant) => {
  if (!restaurant) return null;

  return {
    id: restaurant.id,
    name: restaurant.name,
    description: restaurant.description,
    address: restaurant.address,
    city: restaurant.city,
    district: restaurant.district,
    average_check: Number(restaurant.average_check),
    price_category: restaurant.price_category,
    is_active: restaurant.is_active,
    cuisines: restaurant.cuisines ? restaurant.cuisines.map(cuisineView) : undefined,
    created_at: restaurant.created_at || restaurant.createdAt,
    updated_at: restaurant.updated_at || restaurant.updatedAt
  };
};

module.exports = { restaurantView, cuisineView };
