import "reflect-metadata"  // позволяет декораторам TypeORM читать типы TypeScript
import { DataSource } from "typeorm"

// импорт всех entity (таблиц)
import { User } from "./models/user.entity"
import { Restaurant } from "./models/restaurant.entity"
import { Cuisine } from "./models/cuisine.entity"
import { RestaurantCuisine } from "./models/restaurant-cuisine.entity"
import { Table } from "./models/table.entity"
import { MenuItem } from "./models/menu-item.entity"
import { RestaurantPhoto } from "./models/restaurant-photo.entity"
import { Booking } from "./models/booking.entity"
import { Review } from "./models/review.entity"

// DataSource — главный объект для работы с БД
// через AppDataSource.getRepository(Entity) получаем доступ к таблице
export const AppDataSource = new DataSource({
  type: "postgres",                      // тип базы данных
  host: process.env.DB_HOST || "localhost",  // откуда: из .env или localhost
  port: +(process.env.DB_PORT || 5432),      // порт: из .env или 5432 (+ переводит в число)
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "restaurant_booking",
  synchronize: true,    // автосоздание таблиц (true только для разработки!)
  logging: false,       // не показывать SQL-запросы в консоли
  entities: [           // список всех entity — TypeORM их читает и создаёт таблицы
    User, Restaurant, Cuisine, RestaurantCuisine, Table,
    MenuItem, RestaurantPhoto, Booking, Review
  ]
})