import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { RestaurantDataSource } from "./dataSource";
import { Restaurant } from "./entity/Restaurant";
import { Table } from "./entity/Table";

dotenv.config();

const RESTAURANTS = [
  {
    name: "Пушкин",
    description: "Изысканная русская кухня в историческом интерьере",
    address: "Москва, Тверской бульвар, 26а",
    phone: "+74957397000",
    cuisine_type: "русская",
    price_range: 3,
    rating: 4.7,
  },
  {
    name: "Сыроварня",
    description: "Авторская кухня с акцентом на сыры и фермерские продукты",
    address: "Москва, Бадаевский завод, Кутузовский пр-т, 12",
    phone: "+74957654321",
    cuisine_type: "европейская",
    price_range: 2,
    rating: 4.5,
  },
  {
    name: "Буфет",
    description: "Уютное место с домашней едой по доступным ценам",
    address: "Москва, Маросейка, 9",
    phone: "+74951234567",
    cuisine_type: "русская",
    price_range: 1,
    rating: 4.2,
  },
];

const TABLE_CONFIGS = [
  { table_number: "1", capacity: 2 },
  { table_number: "2", capacity: 2 },
  { table_number: "3", capacity: 4 },
  { table_number: "4", capacity: 4 },
];

async function seed() {
  const dbPath = process.env.RESTAURANT_DATABASE_PATH || path.join(process.cwd(), "data", "restaurant.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  await RestaurantDataSource.initialize();
  const restaurantRepo = RestaurantDataSource.getRepository(Restaurant);
  const tableRepo = RestaurantDataSource.getRepository(Table);

  const count = await restaurantRepo.count();
  if (count > 0) {
    console.log(`БД ресторанов уже заполнена (${count}). Пропуск seed.`);
    await RestaurantDataSource.destroy();
    return;
  }

  for (const data of RESTAURANTS) {
    const restaurant = restaurantRepo.create(data);
    await restaurantRepo.save(restaurant);
    console.log(`Создан ресторан: ${restaurant.name} (${restaurant.id})`);
    for (const tableData of TABLE_CONFIGS) {
      const table = tableRepo.create({ ...tableData, restaurant_id: restaurant.id });
      await tableRepo.save(table);
    }
  }

  console.log("Seed завершён.");
  await RestaurantDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
