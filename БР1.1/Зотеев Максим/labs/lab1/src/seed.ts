import { AppDataSource } from "./data-source";
import { PropertyType } from "./entities/PropertyType";
import { Amenity } from "./entities/Amenity";

const PROPERTY_TYPES = ["Квартира", "Дом", "Комната", "Апартаменты", "Студия"];

const AMENITIES = [
  "Wi-Fi",
  "Парковка",
  "Кондиционер",
  "Стиральная машина",
  "Посудомоечная машина",
  "Телевизор",
  "Лифт",
  "Балкон",
  "Отопление",
  "Можно с животными",
];

export const seed = async () => {
  const typesRepo = AppDataSource.getRepository(PropertyType);
  for (const name of PROPERTY_TYPES) {
    const exists = await typesRepo.findOne({ where: { name } });
    if (!exists) await typesRepo.save(typesRepo.create({ name }));
  }

  const amenityRepo = AppDataSource.getRepository(Amenity);
  for (const name of AMENITIES) {
    const exists = await amenityRepo.findOne({ where: { name } });
    if (!exists) await amenityRepo.save(amenityRepo.create({ name }));
  }
};

if (require.main === module) {
  AppDataSource.initialize()
    .then(seed)
    .then(() => {
      console.log("Seed completed");
      return AppDataSource.destroy();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
