import { Router } from "express";
import {
  getRestaurant,
  getRestaurantMenus,
  getRestaurantPhotos,
  getRestaurantTables,
  listCuisines,
  listRestaurants
} from "../controllers/restaurantController";
import { createReview, listReviews } from "../controllers/reviewController";
import { authRequired } from "../middleware/auth";

export const restaurantRoutes = Router();

restaurantRoutes.get("/cuisines", listCuisines);
restaurantRoutes.get("/restaurants", listRestaurants);
restaurantRoutes.get("/restaurants/:id", getRestaurant);
restaurantRoutes.get("/restaurants/:id/tables", getRestaurantTables);
restaurantRoutes.get("/restaurants/:id/photos", getRestaurantPhotos);
restaurantRoutes.get("/restaurants/:id/menu", getRestaurantMenus);
restaurantRoutes.get("/restaurants/:id/reviews", listReviews);
restaurantRoutes.post("/restaurants/:id/reviews", authRequired, createReview);
