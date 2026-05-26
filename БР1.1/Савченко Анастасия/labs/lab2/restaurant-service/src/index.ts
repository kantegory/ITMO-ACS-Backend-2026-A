import "reflect-metadata"
import express from "express"
import cors from "cors"
import { AppDataSource } from "./data-source"
import { Restaurant } from "./models/restaurant.entity"
import { Cuisine } from "./models/cuisine.entity"
import { Table } from "./models/table.entity"
import { MenuItem } from "./models/menu-item.entity"
import { RestaurantPhoto } from "./models/restaurant-photo.entity"

const app = express()
app.use(cors())
app.use(express.json())

// === CUISINES ===
app.get("/api/v1/cuisines", async (req: any, res: any) => {
  const data = await AppDataSource.getRepository(Cuisine).find()
  return res.json({ data })
})

// === RESTAURANTS ===
app.get("/api/v1/restaurants", async (req: any, res: any) => {
  const { city_name, cuisine_id, cuisine_name, price_tier, search, page = 1, limit = 10 } = req.query
  const qb = AppDataSource.getRepository(Restaurant).createQueryBuilder("r")
    .leftJoinAndSelect("r.restaurantCuisines", "rc").leftJoinAndSelect("rc.cuisine", "c")
    .leftJoinAndSelect("r.photos", "p")

  if (city_name) qb.andWhere("r.city_name = :city_name", { city_name })
  if (price_tier) qb.andWhere("r.price_tier = :price_tier", { price_tier })
  if (cuisine_id) qb.andWhere("rc.cuisine_id = :cuisine_id", { cuisine_id: Number(cuisine_id) })
  if (cuisine_name) qb.andWhere("c.cuisine_name ILIKE :cname", { cname: `%${cuisine_name}%` })
  if (search) qb.andWhere("r.name ILIKE :search", { search: `%${search}%` })

  const [data, total] = await qb.skip((Number(page) - 1) * Number(limit)).take(Number(limit)).getManyAndCount()
  return res.json({
    data: data.map(r => ({
      restaurant_id: r.restaurant_id, name: r.name, city_name: r.city_name, price_tier: r.price_tier,
      main_photo_url: r.photos?.[0]?.photo_url || null,
      rating_avg: 0, reviews_count: 0,
      cuisines: r.restaurantCuisines?.map(rc => ({ cuisine_id: rc.cuisine.cuisine_id, cuisine_name: rc.cuisine.cuisine_name })) || []
    })),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  })
})

app.get("/api/v1/restaurants/:restaurant_id", async (req: any, res: any) => {
  const r = await AppDataSource.getRepository(Restaurant).findOne({
    where: { restaurant_id: Number(req.params.restaurant_id) },
    relations: ["restaurantCuisines", "restaurantCuisines.cuisine", "photos"]
  })
  if (!r) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  return res.json({
    restaurant_id: r.restaurant_id, name: r.name, info: r.info, city_name: r.city_name,
    street_address: r.street_address, price_tier: r.price_tier, latitude: r.latitude, longitude: r.longitude,
    cuisines: r.restaurantCuisines?.map(rc => ({ cuisine_id: rc.cuisine.cuisine_id, cuisine_name: rc.cuisine.cuisine_name })) || [],
    photos: r.photos?.map(p => ({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })) || [],
    rating_avg: 0, reviews_count: 0, created_at: r.created_at
  })
})

// === DISHES ===
app.get("/api/v1/restaurants/:restaurant_id/dishes", async (req: any, res: any) => {
  const data = await AppDataSource.getRepository(MenuItem).find({ where: { restaurant_id: Number(req.params.restaurant_id) } })
  return res.json({ data })
})

app.post("/api/v1/restaurants/:restaurant_id/dishes", async (req: any, res: any) => {
  const d = AppDataSource.getRepository(MenuItem).create({ restaurant_id: Number(req.params.restaurant_id), item_name: req.body.dish_name, cost: req.body.price, category_type: req.body.category, in_stock: true })
  await AppDataSource.getRepository(MenuItem).save(d)
  return res.status(201).json({ dish_id: d.menu_item_id, dish_name: d.item_name, price: d.cost, category: d.category_type })
})

app.patch("/api/v1/dishes/:dish_id", async (req: any, res: any) => {
  await AppDataSource.getRepository(MenuItem).update(Number(req.params.dish_id), { item_name: req.body.dish_name, cost: req.body.price, category_type: req.body.category, in_stock: req.body.is_available })
  const d = await AppDataSource.getRepository(MenuItem).findOne({ where: { menu_item_id: Number(req.params.dish_id) } })
  if (!d) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } })
  return res.json({ dish_id: d.menu_item_id, dish_name: d.item_name, price: d.cost, category: d.category_type, is_available: d.in_stock })
})

app.delete("/api/v1/dishes/:dish_id", async (req: any, res: any) => {
  const d = await AppDataSource.getRepository(MenuItem).findOne({ where: { menu_item_id: Number(req.params.dish_id) } })
  if (!d) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } })
  await AppDataSource.getRepository(MenuItem).remove(d)
  return res.status(204).send()
})

// === TABLES ===
app.get("/api/v1/restaurants/:restaurant_id/tables", async (req: any, res: any) => {
  const data = await AppDataSource.getRepository(Table).find({ where: { restaurant_id: Number(req.params.restaurant_id) } })
  return res.json({ data })
})

app.get("/api/v1/restaurants/:restaurant_id/tables/available", async (req: any, res: any) => {
  const qb = AppDataSource.getRepository(Table).createQueryBuilder("t")
    .where("t.restaurant_id = :rid", { rid: Number(req.params.restaurant_id) }).andWhere("t.is_available = true")
  if (req.query.party_size) qb.andWhere("t.capacity >= :ps", { ps: Number(req.query.party_size) })
  return res.json({ data: await qb.getMany() })
})

// === PHOTOS ===
app.get("/api/v1/restaurants/:restaurant_id/photos", async (req: any, res: any) => {
  const data = await AppDataSource.getRepository(RestaurantPhoto).find({ where: { restaurant_id: Number(req.params.restaurant_id) } })
  return res.json({ data: data.map(p => ({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })) })
})

app.post("/api/v1/restaurants/:restaurant_id/photos", async (req: any, res: any) => {
  const p = AppDataSource.getRepository(RestaurantPhoto).create({ restaurant_id: Number(req.params.restaurant_id), photo_url: req.body.photo_url, display_order: req.body.is_main ? 0 : 1, alt_text: req.body.alt_text })
  await AppDataSource.getRepository(RestaurantPhoto).save(p)
  return res.status(201).json({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0 })
})

app.delete("/api/v1/photos/:photo_id", async (req: any, res: any) => {
  const p = await AppDataSource.getRepository(RestaurantPhoto).findOne({ where: { photo_id: Number(req.params.photo_id) } })
  if (!p) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдено", status: 404 } })
  await AppDataSource.getRepository(RestaurantPhoto).remove(p)
  return res.status(204).send()
})

// === INTERNAL ===
app.get("/api/internal/restaurants/:restaurant_id/exists", async (req: any, res: any) => {
  const r = await AppDataSource.getRepository(Restaurant).findOne({ where: { restaurant_id: Number(req.params.restaurant_id) } })
  if (!r) return res.status(404).json({ exists: false })
  return res.json({ exists: true, restaurant: { restaurant_id: r.restaurant_id, name: r.name } })
})

app.get("/api/internal/tables/:table_id/exists", async (req: any, res: any) => {
  const t = await AppDataSource.getRepository(Table).findOne({ where: { table_id: Number(req.params.table_id), restaurant_id: Number(req.query.restaurant_id) } })
  if (!t) return res.status(404).json({ exists: false })
  return res.json({ exists: true, table: { table_id: t.table_id, table_num: t.table_num, capacity: t.capacity, restaurant_id: t.restaurant_id } })
})

AppDataSource.initialize()
  .then(() => { console.log("restaurant-service: бд подключена"); app.listen(8002, () => console.log("restaurant-service: http://localhost:8002")) })
  .catch(e => console.error("ошибка:", e.message))