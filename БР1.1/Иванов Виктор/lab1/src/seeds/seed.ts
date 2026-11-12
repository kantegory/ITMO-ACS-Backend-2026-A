import "reflect-metadata";
import * as dotenv from "dotenv";
import { AppDataSource } from "../data-source";
import { Restaurant } from "../entities/Restaurant";
import { Table } from "../entities/Table";

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
  {
    name: "Белуга",
    description: "Ресторан высокой кухни, специализирующийся на морепродуктах",
    address: "Москва, Пресненская наб., 12",
    phone: "+74959876543",
    cuisine_type: "морская",
    price_range: 4,
    rating: 4.8,
  },
  {
    name: "Мисато",
    description: "Японская кухня: суши, роллы и горячие блюда",
    address: "Москва, Тверская, 18к1",
    phone: "+74951112233",
    cuisine_type: "японская",
    price_range: 2,
    rating: 4.3,
  },
];

const TABLE_CONFIGS = [
  { table_number: "1", capacity: 2 },
  { table_number: "2", capacity: 2 },
  { table_number: "3", capacity: 4 },
  { table_number: "4", capacity: 4 },
  { table_number: "5", capacity: 6 },
  { table_number: "6", capacity: 6 },
];

async function seed() {
  await AppDataSource.initialize();
  console.log("Connected to database");

  const restaurantRepo = AppDataSource.getRepository(Restaurant);
  const tableRepo = AppDataSource.getRepository(Table);

  const count = await restaurantRepo.count();
  if (count > 0) {
    console.log(`Database already seeded (${count} restaurants found). Skipping.`);
    await AppDataSource.destroy();
    return;
  }

  for (const data of RESTAURANTS) {
    const restaurant = restaurantRepo.create(data);
    await restaurantRepo.save(restaurant);
    console.log(`Created restaurant: ${restaurant.name} (id: ${restaurant.id})`);

    for (const tableData of TABLE_CONFIGS) {
      const table = tableRepo.create({ ...tableData, restaurant_id: restaurant.id });
      await tableRepo.save(table);
    }
    console.log(`  Added ${TABLE_CONFIGS.length} tables`);
  }

  console.log("\nSeed completed successfully!");
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
