import { createDatabase } from "../shared/database";
import { Cuisine, Restaurant, RestaurantTable, RestaurantPhoto, MenuCategory, MenuItem, Review } from "./entities";
export const AppDataSource = createDatabase("CATALOG_DATABASE_PATH", [Cuisine, Restaurant, RestaurantTable, RestaurantPhoto, MenuCategory, MenuItem, Review]);
