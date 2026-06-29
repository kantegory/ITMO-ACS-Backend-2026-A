const toRestaurantResponse = (restaurant) => ({
  id: restaurant.id,
  name: restaurant.name,
  description: restaurant.description,
  address: restaurant.address,
  city: restaurant.city,
  district: restaurant.district,
  average_check: Number(restaurant.average_check),
  price_category: restaurant.price_category,
  created_at: restaurant.created_at,
  updated_at: restaurant.updated_at,
  cuisines: restaurant.cuisines ? restaurant.cuisines.map((cuisine) => ({ id: cuisine.id, name: cuisine.name })) : undefined,
  photos: restaurant.photos ? restaurant.photos.map((photo) => ({ id: photo.id, photo_url: photo.photo_url, is_main: photo.is_main })) : undefined,
});

module.exports = { toRestaurantResponse };
