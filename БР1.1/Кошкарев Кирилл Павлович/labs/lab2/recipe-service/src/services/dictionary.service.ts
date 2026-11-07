import { ILike } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Category, Cuisine, Ingredient, Tag } from '../models';
import { conflict } from '../utils/errors';
import { buildMeta, PageParams, Paginated } from '../utils/pagination';
import { slugify } from '../utils/slugify';

const categories = () => AppDataSource.getRepository(Category);
const cuisines = () => AppDataSource.getRepository(Cuisine);
const tags = () => AppDataSource.getRepository(Tag);
const ingredients = () => AppDataSource.getRepository(Ingredient);

export const dictionaryService = {
  listCategories: () => categories().find({ order: { name: 'ASC' } }),
  async createCategory(name: string, description?: string | null): Promise<Category> {
    const repo = categories();
    if (await repo.findOne({ where: { name } })) throw conflict('Такая категория уже существует');
    return repo.save(repo.create({ name, slug: slugify(name), description: description ?? null }));
  },
  listCuisines: () => cuisines().find({ order: { name: 'ASC' } }),
  async createCuisine(name: string): Promise<Cuisine> {
    const repo = cuisines();
    if (await repo.findOne({ where: { name } })) throw conflict('Такая кухня уже существует');
    return repo.save(repo.create({ name, slug: slugify(name) }));
  },
  listTags: (q?: string) =>
    tags().find({ where: q ? { name: ILike(`%${q}%`) } : {}, order: { name: 'ASC' }, take: 200 }),
  async createTag(name: string): Promise<Tag> {
    const repo = tags();
    const normalized = name.trim().toLowerCase();
    if (await repo.findOne({ where: { name: normalized } })) throw conflict('Такой тег уже существует');
    return repo.save(repo.create({ name: normalized, slug: slugify(normalized) }));
  },
  async resolveTags(names: string[]): Promise<Tag[]> {
    const repo = tags();
    const result: Tag[] = [];
    for (const raw of names) {
      const name = raw.trim().toLowerCase();
      if (!name) continue;
      const slug = slugify(name);
      let tag = await repo.findOne({ where: { slug } });
      if (!tag) tag = await repo.save(repo.create({ name, slug }));
      if (!result.some((item) => item.id === tag!.id)) result.push(tag);
    }
    return result;
  },
  async searchIngredients(q: string | undefined, params: PageParams): Promise<Paginated<Ingredient>> {
    const [data, total] = await ingredients().findAndCount({
      where: q ? { name: ILike(`%${q}%`) } : {},
      order: { name: 'ASC' }, skip: params.skip, take: params.take,
    });
    return { data, meta: buildMeta(total, params) };
  },
  async createIngredient(name: string, defaultUnit: string, kcalPer100?: number | null): Promise<Ingredient> {
    const repo = ingredients();
    if (await repo.findOne({ where: { name } })) throw conflict('Такой ингредиент уже существует');
    return repo.save(repo.create({
      name, defaultUnit,
      kcalPer100: kcalPer100 === undefined || kcalPer100 === null ? null : String(kcalPer100),
    }));
  },
};
