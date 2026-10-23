import {
  Cuisine,
  Restaurant,
  RestaurantCuisine,
  RestaurantMenu,
  RestaurantPhoto,
  RestaurantTable,
  Review
} from "../models/types";

export const restaurantShortView = (
  restaurant: Restaurant,
  cuisines: Cuisine[],
  relations: RestaurantCuisine[]
) => ({
  id: restaurant.restaurant_id,
  name: restaurant.name,
  address: restaurant.address,
  city: restaurant.city,
  price_category: restaurant.price_category,
  cuisines: relations
    .filter((relation) => relation.restaurant_id === restaurant.restaurant_id)
    .map((relation) => cuisines.find((cuisine) => cuisine.cuisine_id === relation.cuisine_id)?.name)
    .filter(Boolean)
});

export const restaurantView = (
  restaurant: Restaurant,
  cuisines: Cuisine[],
  relations: RestaurantCuisine[],
  photos: RestaurantPhoto[],
  menus: RestaurantMenu[],
  tables: RestaurantTable[],
  reviews: Review[]
) => ({
  ...restaurantShortView(restaurant, cuisines, relations),
  description: restaurant.description,
  opening_time: restaurant.opening_time,
  closing_time: restaurant.closing_time,
  created_at: restaurant.created_at,
  photos: photos.filter((photo) => photo.restaurant_id === restaurant.restaurant_id),
  menus: menus.filter((menu) => menu.restaurant_id === restaurant.restaurant_id),
  tables: tables.filter((table) => table.restaurant_id === restaurant.restaurant_id),
  reviews: reviews.filter((review) => review.restaurant_id === restaurant.restaurant_id)
});
