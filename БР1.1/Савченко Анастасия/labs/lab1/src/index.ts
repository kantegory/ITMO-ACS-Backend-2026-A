import "reflect-metadata"
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
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const AppDataSource = new DataSource({
  type: "postgres", host: "localhost", port: 5432,
  username: "postgres", password: "postgres",
  database: "restaurant_booking", synchronize: true,
  entities: [User, Restaurant, Cuisine, MenuItem, Table, Booking, Review, RestaurantPhoto, RestaurantCuisine]
})

const app = express() as any
app.use(express.json())
const JWT_SECRET = process.env.JWT_SECRET || "secret-key"

const auth = (req: any, res: Response, next: any): void => {
  const header = req.headers.authorization
  if (!header) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "нет токена", status: 401 } })
    return
  }
  try {
    const token = header.split(" ")[1]
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } })
    return
  }
}

// === AUTH ===
app.post("/api/v1/auth/register", async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "")
    const password = String(req.body.password || "")
    const name = String(req.body.name || "")
    const phone_num = req.body.phone_num ? String(req.body.phone_num) : null
    const repo = AppDataSource.getRepository(User)
    const exists = await repo.findOne({ where: { email } })
    if (exists) {
      return res.status(400).json({ error: { code: "EMAIL_TAKEN", message: "email занят", status: 400 } })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = repo.create({ email, password: hash, name, phone_num })
    await repo.save(user)
    const { password: _, ...result } = user
    return res.status(201).json(result)
  } catch {
    return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "невалидные данные", status: 422 } })
  }
})

app.post("/api/v1/auth/login", async (req: Request, res: Response) => {
  const email = String(req.body.email || "")
  const password = String(req.body.password || "")
  const user = await AppDataSource.getRepository(User).findOne({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "неверный email или пароль", status: 401 } })
  }
  const payload = { user_id: user.user_id, email: user.email }
  const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
  const refresh_token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
  return res.json({ access_token, refresh_token, expires_in: 3600 })
})

app.post("/api/v1/auth/refresh", async (req: Request, res: Response) => {
  try {
    const refresh_token = String(req.body.refresh_token || "")
    const decoded = jwt.verify(refresh_token, JWT_SECRET) as any
    const payload = { user_id: decoded.user_id, email: decoded.email }
    return res.json({
      access_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }),
      refresh_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }),
      expires_in: 3600
    })
  } catch {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } })
  }
})

// === USERS ===
app.get("/api/v1/users/me", auth, async (req: any, res: Response) => {
  const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: req.user.user_id } })
  if (!user) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  }
  const { password: _, ...result } = user
  return res.json(result)
})

app.patch("/api/v1/users/me", auth, async (req: any, res: Response) => {
  const name = req.body.name ? String(req.body.name) : undefined
  const phone_num = req.body.phone_num ? String(req.body.phone_num) : undefined
  await AppDataSource.getRepository(User).update(req.user.user_id, { name, phone_num })
  const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: req.user.user_id } })
  if (!user) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  }
  const { password: _, ...result } = user
  return res.json(result)
})

// === CUISINES ===
app.get("/api/v1/cuisines", async (req: Request, res: Response) => {
  const data = await AppDataSource.getRepository(Cuisine).find()
  return res.json({ data })
})

// === RESTAURANTS ===
app.get("/api/v1/restaurants", async (req: Request, res: Response) => {
  const city_name = String(req.query.city_name || "")
  const cuisine_id = Number(req.query.cuisine_id) || 0
  const cuisine_name = String(req.query.cuisine_name || "")
  const price_tier = String(req.query.price_tier || "")
  const search = String(req.query.search || "")
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10

  const qb = AppDataSource.getRepository(Restaurant).createQueryBuilder("r")
    .leftJoinAndSelect("r.restaurantCuisines", "rc")
    .leftJoinAndSelect("rc.cuisine", "c")
    .leftJoinAndSelect("r.photos", "p")
    .leftJoinAndSelect("r.reviews", "rev")

  if (city_name) qb.andWhere("r.city_name = :city_name", { city_name })
  if (price_tier) qb.andWhere("r.price_tier = :price_tier", { price_tier })
  if (cuisine_id) qb.andWhere("rc.cuisine_id = :cuisine_id", { cuisine_id })
  if (cuisine_name) qb.andWhere("c.cuisine_name ILIKE :cname", { cname: `%${cuisine_name}%` })
  if (search) qb.andWhere("r.name ILIKE :search", { search: `%${search}%` })

  const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount()
  const formatted = data.map(r => ({
    restaurant_id: r.restaurant_id, name: r.name, city_name: r.city_name, price_tier: r.price_tier,
    main_photo_url: r.photos?.[0]?.photo_url || null,
    rating_avg: r.reviews?.length ? Number((r.reviews.reduce((a, b) => a + b.score, 0) / r.reviews.length).toFixed(1)) : 0,
    cuisines: r.restaurantCuisines?.map(rc => ({ cuisine_id: rc.cuisine.cuisine_id, cuisine_name: rc.cuisine.cuisine_name })) || []
  }))
  return res.json({ data: formatted, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
})

app.get("/api/v1/restaurants/:restaurant_id", async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const r = await AppDataSource.getRepository(Restaurant).findOne({
    where: { restaurant_id },
    relations: ["restaurantCuisines", "restaurantCuisines.cuisine", "photos", "reviews"]
  })
  if (!r) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  }
  const avg = r.reviews?.length ? Number((r.reviews.reduce((a, b) => a + b.score, 0) / r.reviews.length).toFixed(1)) : 0
  return res.json({
    restaurant_id: r.restaurant_id, name: r.name, info: r.info, city_name: r.city_name,
    street_address: r.street_address, price_tier: r.price_tier, latitude: r.latitude, longitude: r.longitude,
    cuisines: r.restaurantCuisines?.map(rc => ({ cuisine_id: rc.cuisine.cuisine_id, cuisine_name: rc.cuisine.cuisine_name })) || [],
    photos: r.photos?.map(p => ({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })) || [],
    rating_avg: avg, reviews_count: r.reviews?.length || 0, created_at: r.created_at
  })
})

// === DISHES ===
app.get("/api/v1/restaurants/:restaurant_id/dishes", async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const category = String(req.query.category || "")
  const qb = AppDataSource.getRepository(MenuItem).createQueryBuilder("d").where("d.restaurant_id = :rid", { rid: restaurant_id })
  if (category) qb.andWhere("d.category_type = :cat", { cat: category })
  const data = await qb.getMany()
  return res.json({ data })
})

app.post("/api/v1/restaurants/:restaurant_id/dishes", auth, async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const dish_name = String(req.body.dish_name || "")
  const description = req.body.description ? String(req.body.description) : null
  const price = Number(req.body.price) || 0
  const category = String(req.body.category || "")
  const is_available = req.body.is_available !== undefined ? Boolean(req.body.is_available) : true
  const image_url = req.body.image_url ? String(req.body.image_url) : null
  const dish = AppDataSource.getRepository(MenuItem).create({
    restaurant_id, item_name: dish_name, details: description,
    cost: price, category_type: category, in_stock: is_available, image_url
  })
  await AppDataSource.getRepository(MenuItem).save(dish)
  return res.status(201).json({ dish_id: dish.menu_item_id, restaurant_id: dish.restaurant_id, dish_name: dish.item_name, price: dish.cost, category: dish.category_type, is_available: dish.in_stock })
})

app.patch("/api/v1/dishes/:dish_id", auth, async (req: Request, res: Response) => {
  const dish_id = Number(req.params.dish_id)
  const updates: any = {}
  if (req.body.dish_name !== undefined) updates.item_name = String(req.body.dish_name)
  if (req.body.description !== undefined) updates.details = String(req.body.description)
  if (req.body.price !== undefined) updates.cost = Number(req.body.price)
  if (req.body.category !== undefined) updates.category_type = String(req.body.category)
  if (req.body.is_available !== undefined) updates.in_stock = Boolean(req.body.is_available)
  if (req.body.image_url !== undefined) updates.image_url = String(req.body.image_url)
  await AppDataSource.getRepository(MenuItem).update(dish_id, updates)
  const d = await AppDataSource.getRepository(MenuItem).findOne({ where: { menu_item_id: dish_id } })
  if (!d) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } })
  }
  return res.json({ dish_id: d.menu_item_id, restaurant_id: d.restaurant_id, dish_name: d.item_name, price: d.cost, category: d.category_type, is_available: d.in_stock })
})

app.delete("/api/v1/dishes/:dish_id", auth, async (req: Request, res: Response) => {
  const dish_id = Number(req.params.dish_id)
  const d = await AppDataSource.getRepository(MenuItem).findOne({ where: { menu_item_id: dish_id } })
  if (!d) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } })
  }
  await AppDataSource.getRepository(MenuItem).remove(d)
  return res.status(204).send()
})

// === TABLES ===
app.get("/api/v1/restaurants/:restaurant_id/tables", async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const data = await AppDataSource.getRepository(Table).find({ where: { restaurant_id } })
  return res.json({ data })
})

app.get("/api/v1/restaurants/:restaurant_id/tables/available", async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const date = String(req.query.date || "")
  const reservation_start = String(req.query.reservation_start || "")
  const reservation_end = String(req.query.reservation_end || "")
  const party_size = Number(req.query.party_size) || 0

  const busy = await AppDataSource.getRepository(Booking).createQueryBuilder("b").select("b.table_id")
    .where("b.date = :date", { date }).andWhere("b.state IN (:...states)", { states: ["pending", "confirmed"] })
    .andWhere("b.reservation_start < :end", { end: reservation_end }).andWhere("b.reservation_end > :start", { start: reservation_start }).getMany()
  const busyIds = busy.map(b => b.table_id)
  const qb = AppDataSource.getRepository(Table).createQueryBuilder("t")
    .where("t.restaurant_id = :rid", { rid: restaurant_id }).andWhere("t.is_available = true")
  if (busyIds.length) qb.andWhere("t.table_id NOT IN (:...ids)", { ids: busyIds })
  if (party_size) qb.andWhere("t.capacity >= :ps", { ps: party_size })
  const data = await qb.getMany()
  return res.json({ data })
})

// === RESERVATIONS ===
app.get("/api/v1/reservations", auth, async (req: any, res: Response) => {
  const data = await AppDataSource.getRepository(Booking).find({
    where: { user_id: req.user.user_id }, relations: ["restaurant", "table"], order: { created_at: "DESC" }
  })
  return res.json({ data: data.map(b => ({ reservation_id: b.booking_id, restaurant: { restaurant_id: b.restaurant.restaurant_id, name: b.restaurant.name }, table: { table_id: b.table.table_id, table_num: b.table.table_num }, reservation_date: b.date, reservation_start: b.reservation_start, reservation_end: b.reservation_end, guest_count: b.party_size, status: b.state, created_at: b.created_at })) })
})

app.post("/api/v1/reservations", auth, async (req: any, res: Response) => {
  const restaurant_id = Number(req.body.restaurant_id)
  const table_id = Number(req.body.table_id)
  const reservation_date = String(req.body.reservation_date || "")
  const reservation_start = String(req.body.reservation_start || "")
  const reservation_end = String(req.body.reservation_end || "")
  const guest_count = Number(req.body.guest_count)
  const notes = req.body.notes ? String(req.body.notes) : null

  const conflict = await AppDataSource.getRepository(Booking).createQueryBuilder("b")
    .where("b.table_id = :tid", { tid: table_id }).andWhere("b.date = :date", { date: reservation_date })
    .andWhere("b.state IN (:...states)", { states: ["pending", "confirmed"] })
    .andWhere("b.reservation_start < :end", { end: reservation_end }).andWhere("b.reservation_end > :start", { start: reservation_start }).getOne()
  if (conflict) {
    return res.status(409).json({ error: { code: "CONFLICT", message: "столик занят", status: 409 } })
  }
  const b = AppDataSource.getRepository(Booking).create({
    user_id: req.user.user_id, restaurant_id, table_id, date: reservation_date,
    reservation_start, reservation_end, party_size: guest_count, notes
  })
  await AppDataSource.getRepository(Booking).save(b)
  return res.status(201).json({
    reservation_id: b.booking_id, user_id: b.user_id, restaurant_id: b.restaurant_id,
    table_id: b.table_id, reservation_date: b.date, reservation_start: b.reservation_start,
    reservation_end: b.reservation_end, guest_count: b.party_size, status: b.state,
    notes: b.notes, created_at: b.created_at
  })
})

app.patch("/api/v1/reservations/:reservation_id/cancel", auth, async (req: any, res: Response) => {
  const reservation_id = Number(req.params.reservation_id)
  const b = await AppDataSource.getRepository(Booking).findOne({ where: { booking_id: reservation_id } })
  if (!b) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдена", status: 404 } })
  }
  if (b.user_id !== req.user.user_id) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "чужая бронь", status: 403 } })
  }
  b.state = "cancelled"
  await AppDataSource.getRepository(Booking).save(b)
  return res.json({ reservation_id: b.booking_id, status: b.state, updated_at: b.updated_at })
})

// === REVIEWS ===
app.get("/api/v1/restaurants/:restaurant_id/reviews", async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const [data, total] = await AppDataSource.getRepository(Review).findAndCount({
    where: { restaurant_id }, relations: ["user"],
    order: { created_at: "DESC" }, skip: (page - 1) * limit, take: limit
  })
  return res.json({
    data: data.map(r => ({ review_id: r.review_id, user: { user_id: r.user.user_id, name: r.user.name }, score: r.score, comment: r.comment, created_at: r.created_at, edited_at: r.edited_at })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  })
})

app.post("/api/v1/restaurants/:restaurant_id/reviews", auth, async (req: any, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const score = Number(req.body.score)
  const comment = req.body.comment ? String(req.body.comment) : null
  const r = AppDataSource.getRepository(Review).create({ user_id: req.user.user_id, restaurant_id, score, comment })
  await AppDataSource.getRepository(Review).save(r)
  return res.status(201).json({ review_id: r.review_id, user_id: r.user_id, restaurant_id: r.restaurant_id, score: r.score, comment: r.comment, created_at: r.created_at, edited_at: r.edited_at })
})

app.patch("/api/v1/reviews/:review_id", auth, async (req: any, res: Response) => {
  const review_id = Number(req.params.review_id)
  const r = await AppDataSource.getRepository(Review).findOne({ where: { review_id } })
  if (!r) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  }
  if (r.user_id !== req.user.user_id) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "чужой отзыв", status: 403 } })
  }
  if (req.body.score !== undefined) r.score = Number(req.body.score)
  if (req.body.comment !== undefined) r.comment = String(req.body.comment)
  r.edited_at = new Date()
  await AppDataSource.getRepository(Review).save(r)
  return res.json({ review_id: r.review_id, score: r.score, comment: r.comment, edited_at: r.edited_at })
})

app.delete("/api/v1/reviews/:review_id", auth, async (req: any, res: Response) => {
  const review_id = Number(req.params.review_id)
  const r = await AppDataSource.getRepository(Review).findOne({ where: { review_id } })
  if (!r) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  }
  if (r.user_id !== req.user.user_id) {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "чужой отзыв", status: 403 } })
  }
  await AppDataSource.getRepository(Review).remove(r)
  return res.status(204).send()
})

// === PHOTOS ===
app.get("/api/v1/restaurants/:restaurant_id/photos", async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const data = await AppDataSource.getRepository(RestaurantPhoto).find({
    where: { restaurant_id }, order: { display_order: "ASC" }
  })
  return res.json({ data: data.map(p => ({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })) })
})

app.post("/api/v1/restaurants/:restaurant_id/photos", auth, async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.restaurant_id)
  const photo_url = String(req.body.photo_url || "")
  const is_main = Boolean(req.body.is_main)
  const alt_text = req.body.alt_text ? String(req.body.alt_text) : null
  const p = AppDataSource.getRepository(RestaurantPhoto).create({
    restaurant_id, photo_url, display_order: is_main ? 0 : 1, alt_text
  })
  await AppDataSource.getRepository(RestaurantPhoto).save(p)
  return res.status(201).json({ photo_id: p.photo_id, restaurant_id: p.restaurant_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })
})

app.delete("/api/v1/photos/:photo_id", auth, async (req: Request, res: Response) => {
  const photo_id = Number(req.params.photo_id)
  const p = await AppDataSource.getRepository(RestaurantPhoto).findOne({ where: { photo_id } })
  if (!p) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } })
  }
  await AppDataSource.getRepository(RestaurantPhoto).remove(p)
  return res.status(204).send()
})

// === START ===
AppDataSource.initialize()
  .then(() => { console.log("бд подключена"); app.listen(3000, () => console.log("сервер: http://localhost:3000")) })
  .catch(e => console.error("ошибка бд:", e.message))