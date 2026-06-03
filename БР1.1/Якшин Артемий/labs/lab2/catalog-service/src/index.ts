import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { In, Like } from 'typeorm';
import { AppDataSource } from './data-source';
import { Restaurant } from './entities/Restaurant';
import { Cuisine } from './entities/Cuisine';
import { RestaurantPhoto } from './entities/RestaurantPhoto';
import { MenuItem } from './entities/MenuItem';
import { RestaurantTable } from './entities/RestaurantTable';
import { asyncHandler, errorHandler, internalKeyMiddleware, BadRequest, NotFound, svcPostSoft } from './common';

const PORT = Number(process.env.PORT || 8082);
const REVIEW_URL = process.env.REVIEW_URL || 'http://localhost:8084';
const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:8083';

// ── сериализаторы ──────────────────────────────────────────────────
const sCuisine = (c: Cuisine) => ({ cuisine_id: c.cuisine_id, name: c.name });
const sPhoto = (p: RestaurantPhoto) => ({ photo_id: p.photo_id, photo_url: p.photo_url });
const sMenu = (m: MenuItem) => ({ menu_item_id: m.menu_item_id, name: m.name, description: m.description, price: Number(m.price), category: m.category });
const sTable = (t: RestaurantTable) => ({ table_id: t.table_id, table_number: t.table_number, capacity: t.capacity, status: t.status });

interface RatingSummary { restaurant_id: number; average_rating: number; reviews_count: number }

const sRestaurant = (r: Restaurant, rating?: RatingSummary, mainPhoto?: string | null) => ({
  restaurant_id: r.restaurant_id,
  name: r.name,
  description: r.description,
  address: r.address,
  city: r.city,
  price_level: r.price_level,
  opening_time: r.opening_time,
  closing_time: r.closing_time,
  phone: r.phone,
  cuisines: (r.cuisines ?? []).map(sCuisine),
  average_rating: rating?.average_rating ?? 0,
  main_photo: mainPhoto ?? null,
});

async function mainPhotos(restaurantIds: number[]): Promise<Map<number, string>> {
  const m = new Map<number, string>();
  if (!restaurantIds.length) return m;
  const photos = await AppDataSource.getRepository(RestaurantPhoto)
    .createQueryBuilder('p')
    .where('p.restaurant_id IN (:...ids)', { ids: restaurantIds })
    .orderBy('p.is_main', 'DESC').addOrderBy('p.photo_id', 'ASC')
    .getMany();
  for (const p of photos) if (!m.has(p.restaurant_id)) m.set(p.restaurant_id, p.photo_url);
  return m;
}

async function ratingsFor(restaurantIds: number[]): Promise<Map<number, RatingSummary>> {
  const m = new Map<number, RatingSummary>();
  if (!restaurantIds.length) return m;
  const list = await svcPostSoft<RatingSummary[]>(`${REVIEW_URL}/internal/ratings/batch`, { restaurant_ids: restaurantIds }, []);
  for (const r of list) m.set(r.restaurant_id, r);
  return m;
}

async function seed() {
  const restRepo = AppDataSource.getRepository(Restaurant);
  if (await restRepo.count()) return;
  await AppDataSource.transaction(async (em) => {
    const cuisines = await em.getRepository(Cuisine).save(
      em.getRepository(Cuisine).create([
        { name: 'Итальянская' }, { name: 'Японская' }, { name: 'Русская' }, { name: 'Грузинская' }, { name: 'Французская' },
      ]),
    );
    const [ital, jap, rus, geo, fra] = cuisines;
    const r1 = em.getRepository(Restaurant).create({ name: 'La Piazza', description: 'Классическая итальянская кухня в центре Москвы.', address: 'ул. Тверская, 10, Москва', city: 'Москва', price_level: '$$', opening_time: '11:00', closing_time: '23:00', phone: '+74951234567', cuisines: [ital, fra] });
    const r2 = em.getRepository(Restaurant).create({ name: 'Sakura', description: 'Японский ресторан с авторским меню.', address: 'Невский пр., 25, Санкт-Петербург', city: 'Санкт-Петербург', price_level: '$$$', opening_time: '12:00', closing_time: '00:00', phone: '+78122223344', cuisines: [jap] });
    const r3 = em.getRepository(Restaurant).create({ name: 'Тбилисо', description: 'Уютная грузинская кухня с хачапури и хинкали.', address: 'Арбат, 5, Москва', city: 'Москва', price_level: '$$', opening_time: '12:00', closing_time: '23:30', phone: '+74959998877', cuisines: [geo] });
    const r4 = em.getRepository(Restaurant).create({ name: 'Самовар', description: 'Русская кухня и чайные традиции.', address: 'Красная пл., 1, Москва', city: 'Москва', price_level: '$', opening_time: '10:00', closing_time: '22:00', phone: '+74951112233', cuisines: [rus] });
    await em.getRepository(Restaurant).save([r1, r2, r3, r4]);

    const photoRepo = em.getRepository(RestaurantPhoto);
    await photoRepo.save([
      photoRepo.create({ restaurant_id: r1.restaurant_id, photo_url: 'https://example.com/photos/lapiazza-1.jpg', is_main: true }),
      photoRepo.create({ restaurant_id: r1.restaurant_id, photo_url: 'https://example.com/photos/lapiazza-2.jpg' }),
      photoRepo.create({ restaurant_id: r2.restaurant_id, photo_url: 'https://example.com/photos/sakura-1.jpg', is_main: true }),
      photoRepo.create({ restaurant_id: r3.restaurant_id, photo_url: 'https://example.com/photos/tbiliso-1.jpg', is_main: true }),
      photoRepo.create({ restaurant_id: r4.restaurant_id, photo_url: 'https://example.com/photos/samovar-1.jpg', is_main: true }),
    ]);

    const menuRepo = em.getRepository(MenuItem);
    await menuRepo.save([
      menuRepo.create({ restaurant_id: r1.restaurant_id, name: 'Паста Карбонара', description: 'Классическая паста со сливочным соусом.', price: 650, category: 'Основные блюда' }),
      menuRepo.create({ restaurant_id: r1.restaurant_id, name: 'Пицца Маргарита', description: 'Томаты, моцарелла, базилик.', price: 720, category: 'Основные блюда' }),
      menuRepo.create({ restaurant_id: r1.restaurant_id, name: 'Тирамису', description: 'Десерт на основе маскарпоне.', price: 380, category: 'Десерты' }),
      menuRepo.create({ restaurant_id: r2.restaurant_id, name: 'Сет Филадельфия', description: '24 ролла с лососем.', price: 1200, category: 'Роллы' }),
      menuRepo.create({ restaurant_id: r2.restaurant_id, name: 'Рамэн с курицей', description: 'Японский суп с лапшой.', price: 590, category: 'Супы' }),
      menuRepo.create({ restaurant_id: r3.restaurant_id, name: 'Хачапури по-аджарски', description: 'Лодочка из теста с сыром и яйцом.', price: 480, category: 'Основные блюда' }),
      menuRepo.create({ restaurant_id: r3.restaurant_id, name: 'Хинкали (5 шт)', description: 'Сочные грузинские пельмени.', price: 450, category: 'Основные блюда' }),
      menuRepo.create({ restaurant_id: r4.restaurant_id, name: 'Борщ', description: 'Традиционный русский борщ со сметаной.', price: 320, category: 'Супы' }),
      menuRepo.create({ restaurant_id: r4.restaurant_id, name: 'Пельмени домашние', description: 'С говядиной и свининой.', price: 390, category: 'Основные блюда' }),
    ]);

    const tableRepo = em.getRepository(RestaurantTable);
    const tables: RestaurantTable[] = [];
    for (const r of [r1, r2, r3, r4]) {
      for (let n = 1; n <= 5; n++) {
        tables.push(tableRepo.create({ restaurant_id: r.restaurant_id, table_number: n, capacity: n <= 2 ? 2 : n === 3 ? 4 : 6, status: 'available' }));
      }
    }
    await tableRepo.save(tables);
  });
  console.log('[catalog-service] seeded restaurants/cuisines/menu/photos/tables');
}

async function main() {
  await AppDataSource.initialize();
  await seed();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'catalog-service' }));

  const api = express.Router();

  api.get('/cuisines', asyncHandler(async (_req, res) => {
    const items = await AppDataSource.getRepository(Cuisine).find({ order: { name: 'ASC' } });
    res.json(items.map(sCuisine));
  }));

  api.get('/restaurants', asyncHandler(async (req, res) => {
    const { city, cuisine_id, price_level, search } = req.query;
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10) || 20));
    const qb = AppDataSource.getRepository(Restaurant).createQueryBuilder('r').leftJoinAndSelect('r.cuisines', 'c');
    if (city) qb.andWhere('r.city = :city', { city });
    if (price_level) qb.andWhere('r.price_level = :pl', { pl: price_level });
    if (search) qb.andWhere('r.name LIKE :q', { q: `%${search}%` });
    if (cuisine_id) {
      const sub = AppDataSource.createQueryBuilder().select('rc.restaurant_id').from('restaurant_cuisines', 'rc').where('rc.cuisine_id = :cid', { cid: Number(cuisine_id) });
      qb.andWhere(`r.restaurant_id IN (${sub.getQuery()})`).setParameters(sub.getParameters());
    }
    qb.orderBy('r.restaurant_id', 'ASC').skip((page - 1) * limit).take(limit);
    const [rows, total] = await qb.getManyAndCount();
    const ids = rows.map((r) => r.restaurant_id);
    const [ratings, photos] = await Promise.all([ratingsFor(ids), mainPhotos(ids)]);
    res.json({ data: rows.map((r) => sRestaurant(r, ratings.get(r.restaurant_id), photos.get(r.restaurant_id))), total, page, limit });
  }));

  api.get('/restaurants/:id', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) throw BadRequest('Invalid id');
    const r = await AppDataSource.getRepository(Restaurant).findOne({ where: { restaurant_id: id }, relations: ['cuisines', 'photos', 'menu_items'] });
    if (!r) throw NotFound('Restaurant not found');
    const [ratings, photos] = await Promise.all([ratingsFor([id]), mainPhotos([id])]);
    const rating = ratings.get(id);
    res.json({ ...sRestaurant(r, rating, photos.get(id)), photos: (r.photos ?? []).map(sPhoto), menu_items: (r.menu_items ?? []).map(sMenu), reviews_count: rating?.reviews_count ?? 0 });
  }));

  api.get('/restaurants/:id/photos', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!(await AppDataSource.getRepository(Restaurant).findOne({ where: { restaurant_id: id } }))) throw NotFound('Restaurant not found');
    const photos = await AppDataSource.getRepository(RestaurantPhoto).find({ where: { restaurant_id: id } });
    res.json(photos.map(sPhoto));
  }));

  api.get('/restaurants/:id/menu', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!(await AppDataSource.getRepository(Restaurant).findOne({ where: { restaurant_id: id } }))) throw NotFound('Restaurant not found');
    const where: Record<string, unknown> = { restaurant_id: id };
    if (req.query.category) where.category = Like(`%${req.query.category}%`);
    const items = await AppDataSource.getRepository(MenuItem).find({ where });
    res.json(items.map(sMenu));
  }));

  api.get('/restaurants/:id/tables', asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) throw BadRequest('Invalid restaurant id');
    const date = String(req.query.date ?? '');
    const time = String(req.query.time ?? '');
    const guests = req.query.guests ? parseInt(String(req.query.guests), 10) : undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw BadRequest('date must be YYYY-MM-DD');
    if (!/^\d{2}:\d{2}$/.test(time)) throw BadRequest('time must be HH:MM');
    if (guests !== undefined && (!Number.isFinite(guests) || guests < 1)) throw BadRequest('guests must be >= 1');
    if (!(await AppDataSource.getRepository(Restaurant).findOne({ where: { restaurant_id: id } }))) throw NotFound('Restaurant not found');
    const qb = AppDataSource.getRepository(RestaurantTable).createQueryBuilder('t').where('t.restaurant_id = :id', { id });
    if (guests !== undefined) qb.andWhere('t.capacity >= :g', { g: guests });
    const tables = await qb.getMany();
    // запрос занятости у reservation-service (мягко: если недоступен — считаем всё свободным)
    const avail = await svcPostSoft<{ table_id: number; available: boolean }[]>(
      `${RESERVATION_URL}/internal/reservations/availability-batch`,
      { table_ids: tables.map((t) => t.table_id), date, time },
      tables.map((t) => ({ table_id: t.table_id, available: true })),
    );
    const taken = new Set(avail.filter((a) => !a.available).map((a) => a.table_id));
    res.json(tables.map((t) => ({ ...sTable(t), status: taken.has(t.table_id) ? 'reserved' : 'available' })));
  }));

  app.use('/api/v1', api);

  // ── внутренний API ─────────────────────────────────────────────
  const internal = express.Router();
  internal.use(internalKeyMiddleware);
  internal.get('/restaurants/:id', asyncHandler(async (req, res) => {
    const r = await AppDataSource.getRepository(Restaurant).findOne({ where: { restaurant_id: Number(req.params.id) } });
    if (!r) throw NotFound('Restaurant not found');
    res.json({ restaurant_id: r.restaurant_id, name: r.name, city: r.city, address: r.address, price_level: r.price_level });
  }));
  internal.post('/restaurants/batch', asyncHandler(async (req, res) => {
    const ids: number[] = Array.isArray(req.body?.restaurant_ids) ? req.body.restaurant_ids.map(Number) : [];
    if (!ids.length) return res.json([]);
    const rows = await AppDataSource.getRepository(Restaurant).findBy({ restaurant_id: In(ids) });
    res.json(rows.map((r) => ({ restaurant_id: r.restaurant_id, name: r.name, city: r.city, address: r.address, price_level: r.price_level })));
  }));
  internal.get('/tables/:id', asyncHandler(async (req, res) => {
    const t = await AppDataSource.getRepository(RestaurantTable).findOne({ where: { table_id: Number(req.params.id) } });
    if (!t) throw NotFound('Table not found');
    res.json({ table_id: t.table_id, restaurant_id: t.restaurant_id, table_number: t.table_number, capacity: t.capacity });
  }));
  app.use('/internal', internal);

  app.use((_req, _res, next) => next(NotFound('Endpoint not found')));
  app.use(errorHandler);
  app.listen(PORT, () => console.log(`[catalog-service] listening on :${PORT}`));
}

main().catch((e) => { console.error('[catalog-service] fatal', e); process.exit(1); });
