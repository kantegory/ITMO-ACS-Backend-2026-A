import { AppDataSource } from "./data-source";
import { PropertyType } from "./entities/PropertyType";

export async function seedPropertyTypes() {
  const repo = AppDataSource.getRepository(PropertyType);
  if ((await repo.count()) > 0) return;
  await repo.save([
    repo.create({ title: "Квартира", isPublished: true }),
    repo.create({ title: "Дом", isPublished: true }),
    repo.create({ title: "Комната", isPublished: true }),
  ]);
}
