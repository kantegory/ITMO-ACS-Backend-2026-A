import "reflect-metadata" // нужно для typeorm, всегда первым
import express, { Request, Response } from "express"
import { DataSource } from "typeorm"
import { User } from "./models/user.entity"
import { Restaurant } from "./models/restaurant.entity"
import { Cuisine } from "./models/cuisine.entity"
import { MenuItem } from "./models/menu-item.entity"
import { Table } from "./models/table.entity"
import { Booking } from "./models/booking.entity"
import { Review } from "./models/review.entity"
import { RestaurantPhoto } from "./models/restaurant-photo.entity"
import { RestaurantCuisine } from "./models/restaurant-cuisine.entity"
import bcrypt from "bcryptjs" // хэширование паролей
import jwt from "jsonwebtoken" // создание и проверка jwt

// подключение к бд через typeorm
const AppDataSource = new DataSource({
  type: "postgres", host: "localhost", port: 5432,
  username: "postgres", password: "postgres",
  database: "restaurant_booking", synchronize: true, // автосоздание таблиц
  entities: [User, Restaurant, Cuisine, MenuItem, Table, Booking, Review, RestaurantPhoto, RestaurantCuisine]
})

const app = express()
app.use(express.json()) // чтобы читать json в теле запроса
const JWT_SECRET = process.env.JWT_SECRET || "secret-key" // ключ для подписи токенов

// middleware проверки jwt, подставляем перед защищёнными эндпоинтами
const auth = (req: any, res: Response, next: any) => {
  const header = req.headers.authorization
  if (!header) { res.status(401).json({ error: { code: "UNAUTHORIZED", message: "нет токена", status: 401 } }); return }
  try {
    const token = header.split(" ")[1] // "Bearer xxx" → "xxx"
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded // добавляем user_id и email в запрос
    next()
  } catch { res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } }) }
}

// регистрация: хэшируем пароль, сохраняем юзера, возвращаем без пароля
app.post("/api/v1/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone_num } = req.body
    const repo = AppDataSource.getRepository(User)
    const exists = await repo.findOne({ where: { email } })
    if (exists) { res.status(400).json({ error: { code: "EMAIL_TAKEN", message: "email занят", status: 400 } }); return }
    const hash = await bcrypt.hash(password, 10) // 10 — соль, чем больше тем медленнее но безопаснее
    const user = repo.create({ email, password: hash, name, phone_num })
    await repo.save(user)
    const { password: _, ...result } = user // убираем пароль из ответа
    res.status(201).json(result)
  } catch { res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "невалидные данные", status: 422 } }) }
})

// вход: проверяем email и пароль, выдаём два токена
app.post("/api/v1/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body
  const user = await AppDataSource.getRepository(User).findOne({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "неверный email или пароль", status: 401 } }); return
  }
  const payload = { user_id: user.user_id, email: user.email }
  const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }) // живёт 1 час
  const refresh_token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }) // живёт 7 дней
  res.json({ access_token, refresh_token, expires_in: 3600 })
})

// обновление токенов по refresh_token без повторного ввода пароля
app.post("/api/v1/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body
    const decoded = jwt.verify(refresh_token, JWT_SECRET) as any
    const payload = { user_id: decoded.user_id, email: decoded.email }
    res.json({ access_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }), refresh_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }), expires_in: 3600 })
  } catch { res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } }) }
})

// профиль текущего пользователя
app.get("/api/v1/users/me", auth, async (req: any, res: Response) => {
  const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: req.user.user_id } })
  if (!user) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } }); return }
  const { password: _, ...result } = user
  res.json(result)
})

// обновить имя или телефон
app.patch("/api/v1/users/me", auth, async (req: any, res: Response) => {
  const { name, phone_num } = req.body
  await AppDataSource.getRepository(User).update(req.user.user_id, { name, phone_num })
  const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: req.user.user_id } })
  const { password: _, ...result } = user!
  res.json(result)
})

// список всех кухонь для фильтров
app.get("/api/v1/cuisines", async (req: Request, res: Response) => {
  const data = await AppDataSource.getRepository(Cuisine).find()
  res.json({ data })
})

// список ресторанов с фильтрацией и пагинацией
app.get("/api/v1/restaurants", async (req: Request, res: Response) => {
  const { city_name, cuisine_id, cuisine_name, price_tier, search, page = 1, limit = 10 } = req.query as any
  const qb = AppDataSource.getRepository(Restaurant).createQueryBuilder("r")
    .leftJoinAndSelect("r.restaurantCuisines", "rc") // подтягиваем кухни через связь m:n
    .leftJoinAndSelect("rc.cuisine", "c")
    .leftJoinAndSelect("r.photos", "p") // фото для главного фото
    .leftJoinAndSelect("r.reviews", "rev") // отзывы для среднего рейтинга

  if (city_name) qb.andWhere("r.city_name = :city_name", { city_name })
  if (price_tier) qb.andWhere("r.price_tier = :price_tier", { price_tier })
  if (cuisine_id) qb.andWhere("rc.cuisine_id = :cuisine_id", { cuisine_id: +cuisine_id })
  if (cuisine_name) qb.andWhere("c.cuisine_name ILIKE :cname", { cname: `%${cuisine_name}%` }) // частичное совпадение
  if (search) qb.andWhere("r.name ILIKE :search", { search: `%${search}%` })

  const [data, total] = await qb.skip((+page - 1) * +limit).take(+limit).getManyAndCount()
  const formatted = data.map(r => ({
    restaurant_id: r.restaurant_id, name: r.name, city_name: r.city_name, price_tier: r.price_tier,
    main_photo_url: r.photos?.[0]?.photo_url || null, // первое фото как главное
    rating_avg: r.reviews?.length ? +(r.reviews.reduce((a, b) => a + b.score, 0) / r.reviews.length).toFixed(1) : 0, // средняя оценка
    cuisines: r.restaurantCuisines?.map(rc => ({ cuisine_id: rc.cuisine.cuisine_id, cuisine_name: rc.cuisine.cuisine_name })) || []
  }))
  res.json({ data: formatted, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) } })
})

// детали ресторана со всем: кухни, фото, рейтинг, колво отзывов
app.get("/api/v1/restaurants/:restaurant_id", async (req: Request, res: Response) => {
  const r = await AppDataSource.getRepository(Restaurant).findOne({
    where: { restaurant_id: +req.params.restaurant_id },
    relations: ["restaurantCuisines", "restaurantCuisines.cuisine", "photos", "reviews"]
  })
  if (!r) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } }); return }
  const avg = r.reviews?.length ? +(r.reviews.reduce((a, b) => a + b.score, 0) / r.reviews.length).toFixed(1) : 0
  res.json({
    restaurant_id: r.restaurant_id, name: r.name, info: r.info, city_name: r.city_name,
    street_address: r.street_address, price_tier: r.price_tier, latitude: r.latitude, longitude: r.longitude,
    cuisines: r.restaurantCuisines?.map(rc => ({ cuisine_id: rc.cuisine.cuisine_id, cuisine_name: rc.cuisine.cuisine_name })) || [],
    photos: r.photos?.map(p => ({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })) || [],
    rating_avg: avg, reviews_count: r.reviews?.length || 0, created_at: r.created_at
  })
})

// меню ресторана с фильтром по категории
app.get("/api/v1/restaurants/:restaurant_id/dishes", async (req: Request, res: Response) => {
  const { category } = req.query
  const qb = AppDataSource.getRepository(MenuItem).createQueryBuilder("d").where("d.restaurant_id = :rid", { rid: +req.params.restaurant_id })
  if (category) qb.andWhere("d.category_type = :cat", { cat: category })
  res.json({ data: await qb.getMany() })
})

// добавить блюдо в меню (нужна авторизация)
app.post("/api/v1/restaurants/:restaurant_id/dishes", auth, async (req: Request, res: Response) => {
  const { dish_name, description, price, category, is_available, image_url } = req.body
  const dish = AppDataSource.getRepository(MenuItem).create({
    restaurant_id: +req.params.restaurant_id, item_name: dish_name, details: description,
    cost: price, category_type: category, in_stock: is_available ?? true, image_url
  })
  await AppDataSource.getRepository(MenuItem).save(dish)
  res.status(201).json({ dish_id: dish.menu_item_id, restaurant_id: dish.restaurant_id, dish_name: dish.item_name, price: dish.cost, category: dish.category_type, is_available: dish.in_stock })
})

// изменить блюдо (частичное обновление)
app.patch("/api/v1/dishes/:dish_id", auth, async (req: Request, res: Response) => {
  const updates: any = {}
  if (req.body.dish_name) updates.item_name = req.body.dish_name
  if (req.body.description) updates.details = req.body.description
  if (req.body.price) updates.cost = req.body.price
  if (req.body.category) updates.category_type = req.body.category
  if (req.body.is_available !== undefined) updates.in_stock = req.body.is_available
  if (req.body.image_url) updates.image_url = req.body.image_url
  await AppDataSource.getRepository(MenuItem).update(+req.params.dish_id, updates)
  const d = await AppDataSource.getRepository(MenuItem).findOne({ where: { menu_item_id: +req.params.dish_id } })
  if (!d) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } }); return }
  res.json({ dish_id: d.menu_item_id, restaurant_id: d.restaurant_id, dish_name: d.item_name, price: d.cost, category: d.category_type, is_available: d.in_stock })
})

// удалить блюдо
app.delete("/api/v1/dishes/:dish_id", auth, async (req: Request, res: Response) => {
  const d = await AppDataSource.getRepository(MenuItem).findOne({ where: { menu_item_id: +req.params.dish_id } })
  if (!d) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } }); return }
  await AppDataSource.getRepository(MenuItem).remove(d)
  res.status(204).send() // 204 — успешно, без тела ответа
})

// все столики ресторана
app.get("/api/v1/restaurants/:restaurant_id/tables", async (req: Request, res: Response) => {
  res.json({ data: await AppDataSource.getRepository(Table).find({ where: { restaurant_id: +req.params.restaurant_id } }) })
})

// доступные столики на дату и время с учётом вместимости
app.get("/api/v1/restaurants/:restaurant_id/tables/available", async (req: Request, res: Response) => {
  const { date, reservation_start, reservation_end, party_size } = req.query as any
  const busy = await AppDataSource.getRepository(Booking).createQueryBuilder("b").select("b.table_id")
    .where("b.date = :date", { date }).andWhere("b.state IN (:...states)", { states: ["pending", "confirmed"] })
    .andWhere("b.reservation_start < :end", { end: reservation_end }).andWhere("b.reservation_end > :start", { start: reservation_start }).getMany()
  const busyIds = busy.map(b => b.table_id) // id занятых столиков
  const qb = AppDataSource.getRepository(Table).createQueryBuilder("t").where("t.restaurant_id = :rid", { rid: +req.params.restaurant_id }).andWhere("t.is_available = true")
  if (busyIds.length) qb.andWhere("t.table_id NOT IN (:...ids)", { ids: busyIds }) // исключаем занятые
  if (party_size) qb.andWhere("t.capacity >= :ps", { ps: +party_size }) // фильтр по вместимости
  res.json({ data: await qb.getMany() })
})

// история бронирований пользователя
app.get("/api/v1/reservations", auth, async (req: any, res: Response) => {
  const data = await AppDataSource.getRepository(Booking).find({ where: { user_id: req.user.user_id }, relations: ["restaurant", "table"], order: { created_at: "DESC" } })
  res.json({ data: data.map(b => ({ reservation_id: b.booking_id, restaurant: { restaurant_id: b.restaurant.restaurant_id, name: b.restaurant.name }, table: { table_id: b.table.table_id, table_num: b.table.table_num }, reservation_date: b.date, reservation_start: b.reservation_start, reservation_end: b.reservation_end, guest_count: b.party_size, status: b.state, created_at: b.created_at })) })
})

// создать бронь с проверкой на занятость столика
app.post("/api/v1/reservations", auth, async (req: any, res: Response) => {
  const { restaurant_id, table_id, reservation_date, reservation_start, reservation_end, guest_count, notes } = req.body
  const conflict = await AppDataSource.getRepository(Booking).createQueryBuilder("b")
    .where("b.table_id = :tid", { tid: table_id }).andWhere("b.date = :date", { date: reservation_date })
    .andWhere("b.state IN (:...states)", { states: ["pending", "confirmed"] })
    .andWhere("b.reservation_start < :end", { end: reservation_end }).andWhere("b.reservation_end > :start", { start: reservation_start }).getOne()
  if (conflict) { res.status(409).json({ error: { code: "CONFLICT", message: "столик занят", status: 409 } }); return }
  const b = AppDataSource.getRepository(Booking).create({ user_id: req.user.user_id, restaurant_id, table_id, date: reservation_date, reservation_start, reservation_end, party_size: guest_count, notes })
  await AppDataSource.getRepository(Booking).save(b)
  res.status(201).json({ reservation_id: b.booking_id, user_id: b.user_id, restaurant_id: b.restaurant_id, table_id: b.table_id, reservation_date: b.date, reservation_start: b.reservation_start, reservation_end: b.reservation_end, guest_count: b.party_size, status: b.state, notes: b.notes, created_at: b.created_at })
})

// отменить бронь, только свою и не отменённую ранее
app.patch("/api/v1/reservations/:reservation_id/cancel", auth, async (req: any, res: Response) => {
  const b = await AppDataSource.getRepository(Booking).findOne({ where: { booking_id: +req.params.reservation_id } })
  if (!b) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдена", status: 404 } }); return }
  if (b.user_id !== req.user.user_id) { res.status(403).json({ error: { code: "FORBIDDEN", message: "чужая бронь", status: 403 } }); return }
  b.state = "cancelled"; await AppDataSource.getRepository(Booking).save(b)
  res.json({ reservation_id: b.booking_id, status: b.state, updated_at: b.updated_at })
})

// отзывы о ресторане с пагинацией
app.get("/api/v1/restaurants/:restaurant_id/reviews", async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query as any
  const [data, total] = await AppDataSource.getRepository(Review).findAndCount({
    where: { restaurant_id: +req.params.restaurant_id }, relations: ["user"],
    order: { created_at: "DESC" }, skip: (+page - 1) * +limit, take: +limit
  })
  res.json({ data: data.map(r => ({ review_id: r.review_id, user: { user_id: r.user.user_id, name: r.user.name }, score: r.score, comment: r.comment, created_at: r.created_at, edited_at: r.edited_at })), pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) } })
})

// создать отзыв
app.post("/api/v1/restaurants/:restaurant_id/reviews", auth, async (req: any, res: Response) => {
  const { score, comment } = req.body
  const r = AppDataSource.getRepository(Review).create({ user_id: req.user.user_id, restaurant_id: +req.params.restaurant_id, score, comment })
  await AppDataSource.getRepository(Review).save(r)
  res.status(201).json({ review_id: r.review_id, user_id: r.user_id, restaurant_id: r.restaurant_id, score: r.score, comment: r.comment, created_at: r.created_at, edited_at: r.edited_at })
})

// изменить свой отзыв
app.patch("/api/v1/reviews/:review_id", auth, async (req: any, res: Response) => {
  const r = await AppDataSource.getRepository(Review).findOne({ where: { review_id: +req.params.review_id } })
  if (!r) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } }); return }
  if (r.user_id !== req.user.user_id) { res.status(403).json({ error: { code: "FORBIDDEN", message: "чужой отзыв", status: 403 } }); return }
  if (req.body.score) r.score = req.body.score
  if (req.body.comment) r.comment = req.body.comment
  r.edited_at = new Date(); await AppDataSource.getRepository(Review).save(r)
  res.json({ review_id: r.review_id, score: r.score, comment: r.comment, edited_at: r.edited_at })
})

// удалить свой отзыв
app.delete("/api/v1/reviews/:review_id", auth, async (req: any, res: Response) => {
  const r = await AppDataSource.getRepository(Review).findOne({ where: { review_id: +req.params.review_id } })
  if (!r) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } }); return }
  if (r.user_id !== req.user.user_id) { res.status(403).json({ error: { code: "FORBIDDEN", message: "чужой отзыв", status: 403 } }); return }
  await AppDataSource.getRepository(Review).remove(r); res.status(204).send()
})

// фото ресторана, сортировка по display_order
app.get("/api/v1/restaurants/:restaurant_id/photos", async (req: Request, res: Response) => {
  const data = await AppDataSource.getRepository(RestaurantPhoto).find({ where: { restaurant_id: +req.params.restaurant_id }, order: { display_order: "ASC" } })
  res.json({ data: data.map(p => ({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })) })
})

// добавить фото ресторана
app.post("/api/v1/restaurants/:restaurant_id/photos", auth, async (req: Request, res: Response) => {
  const { photo_url, is_main, alt_text } = req.body
  const p = AppDataSource.getRepository(RestaurantPhoto).create({ restaurant_id: +req.params.restaurant_id, photo_url, display_order: is_main ? 0 : 1, alt_text })
  await AppDataSource.getRepository(RestaurantPhoto).save(p)
  res.status(201).json({ photo_id: p.photo_id, restaurant_id: p.restaurant_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })
})

// удалить фото
app.delete("/api/v1/photos/:photo_id", auth, async (req: Request, res: Response) => {
  const p = await AppDataSource.getRepository(RestaurantPhoto).findOne({ where: { photo_id: +req.params.photo_id } })
  if (!p) { res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } }); return }
  await AppDataSource.getRepository(RestaurantPhoto).remove(p); res.status(204).send()
})

// запуск: подключаем бд, потом сервер
AppDataSource.initialize()
  .then(() => { console.log("бд подключена"); app.listen(3000, () => console.log("сервер: http://localhost:3000")) })
  .catch(e => console.error("ошибка бд:", e.message))