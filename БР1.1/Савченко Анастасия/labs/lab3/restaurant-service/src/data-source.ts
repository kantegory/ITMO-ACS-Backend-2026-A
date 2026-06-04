import "reflect-metadata"
import { DataSource } from "typeorm"
import { Restaurant } from "./models/restaurant.entity"
import { Cuisine } from "./models/cuisine.entity"
import { RestaurantCuisine } from "./models/restaurant-cuisine.entity"
import { Table } from "./models/table.entity"
import { MenuItem } from "./models/menu-item.entity"
import { RestaurantPhoto } from "./models/restaurant-photo.entity"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: "postgres", password: "postgres",
  database: "restaurant_db",
  synchronize: true,
  entities: [Restaurant, Cuisine, RestaurantCuisine, Table, MenuItem, RestaurantPhoto]
})