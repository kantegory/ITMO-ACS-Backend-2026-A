import "reflect-metadata"
import { DataSource } from "typeorm"
import { Restaurant } from "./src/models/restaurant.entity"
import { Cuisine } from "./src/models/cuisine.entity"
import { RestaurantCuisine } from "./src/models/restaurant-cuisine.entity"
import { Table } from "./src/models/table.entity"
import { MenuItem } from "./src/models/menu-item.entity"
import { RestaurantPhoto } from "./src/models/restaurant-photo.entity"

async function seed() {
  const ds = new DataSource({
    type: "postgres", host: "localhost", port: 5432,
    username: "postgres", password: "postgres",
    database: "restaurant_db", synchronize: true,
    entities: [Restaurant, Cuisine, RestaurantCuisine, Table, MenuItem, RestaurantPhoto]
  })
  await ds.initialize()
  const cuisines = await ds.getRepository(Cuisine).save([
    { cuisine_name: "Итальянская" }, { cuisine_name: "Японская" }, { cuisine_name: "Русская" }, { cuisine_name: "Французская" }
  ])
  const rests = await ds.getRepository(Restaurant).save([
    { name: "Итальяно", info: "Уютный ресторан", city_name: "Санкт-Петербург", street_address: "Невский пр., 55", price_tier: "mid", latitude: 59.9343, longitude: 30.3351 },
    { name: "Суши-Хаус", info: "Японская кухня", city_name: "Москва", street_address: "Тверская, 10", price_tier: "high", latitude: 55.7558, longitude: 37.6176 }
  ])
  await ds.getRepository(RestaurantCuisine).save([
    { restaurant_id: rests[0].restaurant_id, cuisine_id: cuisines[0].cuisine_id },
    { restaurant_id: rests[0].restaurant_id, cuisine_id: cuisines[3].cuisine_id },
    { restaurant_id: rests[1].restaurant_id, cuisine_id: cuisines[1].cuisine_id }
  ])
  await ds.getRepository(Table).save([
    { restaurant_id: rests[0].restaurant_id, table_num: "A1", capacity: 4, area: "Основной зал" },
    { restaurant_id: rests[0].restaurant_id, table_num: "A2", capacity: 2, area: "Основной зал" },
    { restaurant_id: rests[1].restaurant_id, table_num: "1", capacity: 6, area: "VIP" }
  ])
  await ds.getRepository(MenuItem).save([
    { restaurant_id: rests[0].restaurant_id, item_name: "Карбонара", details: "Паста с беконом", cost: 750, category_type: "Паста", in_stock: true },
    { restaurant_id: rests[1].restaurant_id, item_name: "Филадельфия", details: "Ролл с лососем", cost: 890, category_type: "Роллы", in_stock: true }
  ])
  console.log("restaurant_db заполнена")
  await ds.destroy()
}
seed().catch(e => console.error(e))
