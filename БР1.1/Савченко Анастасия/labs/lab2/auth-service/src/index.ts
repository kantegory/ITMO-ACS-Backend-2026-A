import "reflect-metadata"
import express from "express"
import cors from "cors"
import { AppDataSource } from "./data-source"
import { User } from "./models/user.entity"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const app = express()
app.use(cors())
app.use(express.json())
const JWT_SECRET = "secret-key"

// middleware auth
const auth = (req: any, res: any, next: any) => {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "нет токена", status: 401 } })
  try {
    const token = header.split(" ")[1]
    req.user = jwt.verify(token, JWT_SECRET) as any
    next()
  } catch { return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } }) }
}

// внешние эндпоинты
app.post("/api/v1/auth/register", async (req: any, res: any) => {
  try {
    const { email, password, name, phone_num } = req.body
    const repo = AppDataSource.getRepository(User)
    const exists = await repo.findOne({ where: { email } })
    if (exists) return res.status(400).json({ error: { code: "EMAIL_TAKEN", message: "email занят", status: 400 } })
    const hash = await bcrypt.hash(password, 10)
    const user = repo.create({ email, password: hash, name, phone_num })
    await repo.save(user)
    const { password: _, ...result } = user
    return res.status(201).json(result)
  } catch { return res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "невалидные данные", status: 422 } }) }
})

app.post("/api/v1/auth/login", async (req: any, res: any) => {
  const { email, password } = req.body
  const user = await AppDataSource.getRepository(User).findOne({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "неверный email или пароль", status: 401 } })
  const payload = { user_id: user.user_id, email: user.email }
  return res.json({ access_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }), refresh_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }), expires_in: 3600 })
})

app.post("/api/v1/auth/refresh", async (req: any, res: any) => {
  try {
    const decoded = jwt.verify(req.body.refresh_token, JWT_SECRET) as any
    const payload = { user_id: decoded.user_id, email: decoded.email }
    return res.json({ access_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }), refresh_token: jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }), expires_in: 3600 })
  } catch { return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } }) }
})

app.get("/api/v1/users/me", auth, async (req: any, res: any) => {
  const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: req.user.user_id } })
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  const { password: _, ...result } = user
  return res.json(result)
})

app.patch("/api/v1/users/me", auth, async (req: any, res: any) => {
  await AppDataSource.getRepository(User).update(req.user.user_id, { name: req.body.name, phone_num: req.body.phone_num })
  const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: req.user.user_id } })
  if (!user) return res.status(404).json({ error: { code: "NOT_FOUND", message: "не найден", status: 404 } })
  const { password: _, ...result } = user
  return res.json(result)
})

// внутренний эндпоинт
app.get("/api/internal/users/:user_id/exists", async (req: any, res: any) => {
  const user = await AppDataSource.getRepository(User).findOne({ where: { user_id: Number(req.params.user_id) } })
  if (!user) return res.status(404).json({ exists: false })
  return res.json({ exists: true, user: { user_id: user.user_id, name: user.name, email: user.email } })
})

AppDataSource.initialize()
  .then(() => { console.log("auth-service: бд подключена"); app.listen(8001, () => console.log("auth-service: http://localhost:8001")) })
  .catch(e => console.error("ошибка:", e.message))