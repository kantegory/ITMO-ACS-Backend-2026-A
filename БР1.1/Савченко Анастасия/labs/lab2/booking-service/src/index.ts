import "reflect-metadata"
import express from "express"
import cors from "cors"
import { AppDataSource } from "./data-source"
import { Booking } from "./models/booking.entity"
import { Review } from "./models/review.entity"
import jwt from "jsonwebtoken"

const app = express()
app.use(cors())
app.use(express.json())
const JWT_SECRET = "secret-key"

const auth = (req: any, res: any, next: any) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "нет токена", status: 401 } })
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET) as any
    next()
  } catch { return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } }) }
}

// проверка через другие сервисы
const checkUser = async (user_id: number) => {
  const res = await fetch(`http://localhost:8001/api/internal/users/${user_id}/exists`)
  return res.json()
}

const checkRestaurant = async (restaurant_id: number) => {
  const res = await fetch(`http://localhost:8002/api/internal/restaurants/${restaurant_id}/exists`)
  return res.json()
}

const checkTable = async (table_id: number, restaurant_id: number) => {
  const res = await fetch(`http://localhost:8002/api/internal/tables/${table_id}/exists?restaurant_id=${restaurant_id}`)
  return res.json()
}

// === RESERVATIONS ===
app.get("/api/v1/reservations", auth, async (req: any, res: any) => {
  const data = await AppDataSource.getRepository(Booking).find({ where: { user_id: req.user.user_id }, order: { created_at: "DESC" } })
  return res.json({ data: data.map(b => ({ reservation_id: b.booking_id, user_id: b.user_id, restaurant_id: b.restaurant_id, table_id: b.table_id, reservation_date: b.date, reservation_start: b.reservation_start, reservation_end: b.reservation_end, guest_count: b.party_size, status: b.state, created_at: b.created_at })) })
})

app.post("/api/v1/reservations", auth, async (req: any, res: any) => {
  const { restaurant_id, table_id, reservation_date, reservation_start, reservation_end, guest_count, notes } = req.body

  const restaurantCheck = await checkRestaurant(Number(restaurant_id))
  if (!restaurantCheck.exists) return res.status(404).json({ error: { code: "NOT_FOUND", message: "ресторан не найден", status: 404 } })

  const tableCheck = await checkTable(Number(table_id), Number(restaurant_id))
  if (!tableCheck.exists) return res.status(404).json({ error: { code: "NOT_FOUND", message: "столик не найден", status: 404 } })

  const conflict = await AppDataSource.getRepository(Booking).createQueryBuilder("b")
    .where("b.table_id = :tid", { tid: Number(table_id) }).andWhere("b.date = :date", { date: reservation_date })
    .andWhere("b.state IN (:...states)", { states: ["pending", "confirmed"] })
    .andWhere("b.reservation_start < :end", { end: reservation_end }).andWhere("b.reservation_end > :start", { start: reservation_start }).getOne()
  if (conflict) return res.status(409).json({ error: { code: "CONFLICT", message: "столик занят", status: 409 } })

  const b = AppDataSource.getRepository(Booking).create({ user_id: req.user.user_id, restaurant_id: Number(restaurant_id), table_id: Number(table_id), date: reservation_date, reservation_start, reservation_end, party_size: Number(guest_count), notes })
  await AppDataSource.getRepository(Booking).save(b)
  return res.status(201).json({ reservation_id: b.booking_id, user_id: b.user_id, restaurant_id: b.restaurant_id, table_id: b.table_id, reservation_date: b.date, reservation_start: b.reservation_start, reservation_end: b.reservation_end, guest_count: b.party_size, status: b.state, notes: b.notes, created_at: b.created_at })
})

app.patch("/api/v1/reservations/:reservation_id/cancel", auth, async (req: any, res: any) => {
  const b = await AppDataSource.getRepository(Booking).findOne({ where: { booking_id: Number(req.params.reservation_id) } })
  if (!b) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найдена", status: 404 } })
  if (b.user_id !== req.user.user_id) return res.status(403).json({ error: { code: "FORBIDDEN", message: "чужая бронь", status: 403 } })
  b.state = "cancelled"
  await AppDataSource.getRepository(Booking).save(b)
  return res.json({ reservation_id: b.booking_id, status: b.state, updated_at: b.updated_at })
})

// === REVIEWS ===
app.get("/api/v1/restaurants/:restaurant_id/reviews", async (req: any, res: any) => {
  const [data, total] = await AppDataSource.getRepository(Review).findAndCount({ where: { restaurant_id: Number(req.params.restaurant_id) }, order: { created_at: "DESC" }, skip: 0, take: 10 })
  return res.json({ data: data.map(r => ({ review_id: r.review_id, user_id: r.user_id, score: r.score, comment: r.comment, created_at: r.created_at })), pagination: { page: 1, limit: 10, total } })
})

app.post("/api/v1/restaurants/:restaurant_id/reviews", auth, async (req: any, res: any) => {
  const restaurantCheck = await checkRestaurant(Number(req.params.restaurant_id))
  if (!restaurantCheck.exists) return res.status(404).json({ error: { code: "NOT_FOUND", message: "ресторан не найден", status: 404 } })

  const r = AppDataSource.getRepository(Review).create({ user_id: req.user.user_id, restaurant_id: Number(req.params.restaurant_id), score: Number(req.body.score), comment: req.body.comment })
  await AppDataSource.getRepository(Review).save(r)
  return res.status(201).json({ review_id: r.review_id, user_id: r.user_id, restaurant_id: r.restaurant_id, score: r.score, comment: r.comment, created_at: r.created_at })
})

app.patch("/api/v1/reviews/:review_id", auth, async (req: any, res: any) => {
  const r = await AppDataSource.getRepository(Review).findOne({ where: { review_id: Number(req.params.review_id) } })
  if (!r) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  if (r.user_id !== req.user.user_id) return res.status(403).json({ error: { code: "FORBIDDEN", message: "чужой отзыв", status: 403 } })
  if (req.body.score) r.score = Number(req.body.score)
  if (req.body.comment) r.comment = req.body.comment
  r.edited_at = new Date()
  await AppDataSource.getRepository(Review).save(r)
  return res.json({ review_id: r.review_id, score: r.score, comment: r.comment, edited_at: r.edited_at })
})

app.delete("/api/v1/reviews/:review_id", auth, async (req: any, res: any) => {
  const r = await AppDataSource.getRepository(Review).findOne({ where: { review_id: Number(req.params.review_id) } })
  if (!r) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  if (r.user_id !== req.user.user_id) return res.status(403).json({ error: { code: "FORBIDDEN", message: "чужой отзыв", status: 403 } })
  await AppDataSource.getRepository(Review).remove(r)
  return res.status(204).send()
})

// === INTERNAL ===
app.get("/api/internal/restaurants/:restaurant_id/stats", async (req: any, res: any) => {
  const reviews = await AppDataSource.getRepository(Review).find({ where: { restaurant_id: Number(req.params.restaurant_id) } })
  const avg = reviews.length ? Number((reviews.reduce((a, r) => a + r.score, 0) / reviews.length).toFixed(1)) : 0
  return res.json({ rating_avg: avg, reviews_count: reviews.length })
})

AppDataSource.initialize()
  .then(() => { console.log("booking-service: бд подключена"); app.listen(8003, () => console.log("booking-service: http://localhost:8003")) })
  .catch(e => console.error("ошибка:", e.message))