import { Request, Response } from "express";
import {
  cuisines,
  menus,
  photos,
  restaurantCuisines,
  restaurants,
  reviews,
  tables
} from "../data/store";
import { error, ok } from "../views/apiView";
import { restaurantShortView, restaurantView } from "../views/restaurantView";

const findRestaurant = (id: number) => restaurants.find((restaurant) => restaurant.restaurant_id === id);

export const listRestaurants = (req: Request, res: Response): Response => {
  const { city, cuisine, price_category } = req.query;

  const filtered = restaurants.filter((restaurant) => {
    const restaurantCuisineNames = restaurantCuisines
      .filter((relation) => relation.restaurant_id === restaurant.restaurant_id)
      .map((relation) => cuisines.find((item) => item.cuisine_id === relation.cuisine_id)?.name);

    return (
      (!city || restaurant.city.toLowerCase() === String(city).toLowerCase()) &&
      (!price_category || restaurant.price_category === price_category) &&
      (!cuisine || restaurantCuisineNames.includes(String(cuisine)))
    );
  });

  return ok(
    res,
    filtered.map((restaurant) => restaurantShortView(restaurant, cuisines, restaurantCuisines))
  );
};

export const getRestaurant = (req: Request, res: Response): Response => {
  const restaurant = findRestaurant(Number(req.params.id));

  if (!restaurant) {
    return error(res, 404, "Ресторан не найден");
  }

  return ok(res, restaurantView(restaurant, cuisines, restaurantCuisines, photos, menus, tables, reviews));
};

export const getRestaurantTables = (req: Request, res: Response): Response => {
  const restaurant = findRestaurant(Number(req.params.id));

  if (!restaurant) {
    return error(res, 404, "Ресторан не найден");
  }

  return ok(
    res,
    tables
      .filter((table) => table.restaurant_id === restaurant.restaurant_id)
      .map((table) => ({
        id: table.table_id,
        restaurant_id: table.restaurant_id,
        table_number: table.table_number,
        capacity: table.capacity,
        location_description: table.location_description,
        is_active: table.is_active
      }))
  );
};

export const getRestaurantPhotos = (req: Request, res: Response): Response => {
  const restaurant = findRestaurant(Number(req.params.id));

  if (!restaurant) {
    return error(res, 404, "Ресторан не найден");
  }

  return ok(res, photos.filter((photo) => photo.restaurant_id === restaurant.restaurant_id));
};

export const getRestaurantMenus = (req: Request, res: Response): Response => {
  const restaurant = findRestaurant(Number(req.params.id));

  if (!restaurant) {
    return error(res, 404, "Ресторан не найден");
  }

  return ok(res, menus.filter((menu) => menu.restaurant_id === restaurant.restaurant_id));
};

export const listCuisines = (_req: Request, res: Response): Response => ok(res, cuisines);
