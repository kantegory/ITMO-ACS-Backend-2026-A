import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./models/user.entity"
import { Restaurant } from "./models/restaurant.entity"
import { Cuisine } from "./models/cuisine.entity"
import { Table } from "./models/table.entity"
import { MenuItem } from "./models/menu-item.entity"
import { RestaurantCuisine } from "./models/restaurant-cuisine.entity"
import { Booking } from "./models/booking.entity"
import { Review } from "./models/review.entity"
import { RestaurantPhoto } from "./models/restaurant-photo.entity"
import bcrypt from "bcryptjs"

const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost", port: 5432,
  username: "postgres", password: "postgres",
  database: "restaurant_booking",
  synchronize: true,
  entities: [User, Restaurant, Cuisine, Table, MenuItem, RestaurantCuisine, Booking, Review, RestaurantPhoto]
})

async function seed() {
  await AppDataSource.initialize()
  console.log("заполняем бд...")

  const hash = await bcrypt.hash("123456", 10)
  await AppDataSource.getRepository(User).save([
    { email: "test@test.com", password: hash, name: "Анастасия", phone_num: "+79111234567" },
    { email: "admin@test.com", password: hash, name: "Админ", phone_num: "+79219876543" }
  ])
  console.log("юзеры ок")

  const cuisines = await AppDataSource.getRepository(Cuisine).save([
    { cuisine_name: "Итальянская" },
    { cuisine_name: "Японская" },
    { cuisine_name: "Русская" },
    { cuisine_name: "Французская" },
    { cuisine_name: "Грузинская" }
  ])
  console.log("кухни ок")

  const rests = await AppDataSource.getRepository(Restaurant).save([
    { name: "Итальяно", info: "Уютный итальянский ресторан", city_name: "Санкт-Петербург", street_address: "Невский пр., 55", price_tier: "mid", latitude: 59.9343, longitude: 30.3351 },
    { name: "Суши-Хаус", info: "Японская кухня", city_name: "Москва", street_address: "Тверская, 10", price_tier: "high", latitude: 55.7558, longitude: 37.6176 },
    { name: "Блины", info: "Русская кухня", city_name: "Санкт-Петербург", street_address: "Литейный, 20", price_tier: "low", latitude: 59.9386, longitude: 30.3478 }
  ])
  console.log("рестораны ок")

  await AppDataSource.getRepository(RestaurantCuisine).save([
    { restaurant_id: rests[0].restaurant_id, cuisine_id: cuisines[0].cuisine_id },
    { restaurant_id: rests[0].restaurant_id, cuisine_id: cuisines[3].cuisine_id },
    { restaurant_id: rests[1].restaurant_id, cuisine_id: cuisines[1].cuisine_id },
    { restaurant_id: rests[2].restaurant_id, cuisine_id: cuisines[2].cuisine_id }
  ])
  console.log("связи кухонь ок")

  await AppDataSource.getRepository(Table).save([
    { restaurant_id: rests[0].restaurant_id, table_num: "A1", capacity: 4, area: "Основной зал" },
    { restaurant_id: rests[0].restaurant_id, table_num: "A2", capacity: 2, area: "Основной зал" },
    { restaurant_id: rests[0].restaurant_id, table_num: "B1", capacity: 6, area: "VIP" },
    { restaurant_id: rests[1].restaurant_id, table_num: "1", capacity: 4, area: "Основной зал" },
    { restaurant_id: rests[2].restaurant_id, table_num: "01", capacity: 8, area: "Терраса" }
  ])
  console.log("столики ок")

  await AppDataSource.getRepository(MenuItem).save([
    { restaurant_id: rests[0].restaurant_id, item_name: "Карбонара", details: "Паста с беконом", cost: 750, category_type: "Паста", in_stock: true },
    { restaurant_id: rests[0].restaurant_id, item_name: "Маргарита", details: "Пицца классическая", cost: 650, category_type: "Пицца", in_stock: true },
    { restaurant_id: rests[1].restaurant_id, item_name: "Филадельфия", details: "Ролл с лососем", cost: 890, category_type: "Роллы", in_stock: true },
    { restaurant_id: rests[2].restaurant_id, item_name: "Блины с икрой", details: "Тонкие блины", cost: 450, category_type: "Горячее", in_stock: true }
  ])
  console.log("блюда ок")

  console.log("готово!")
  await AppDataSource.destroy()
}

seed().catch(e => console.error(e))