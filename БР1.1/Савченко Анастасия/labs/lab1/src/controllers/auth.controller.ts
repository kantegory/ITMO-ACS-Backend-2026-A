import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../models/user.entity"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const userRepo = AppDataSource.getRepository(User)
const secret = process.env.JWT_SECRET || "secret-key"

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone_num } = req.body
    const exists = await userRepo.findOne({ where: { email } })
    if (exists) {
      res.status(400).json({ error: { code: "EMAIL_TAKEN", message: "email занят", status: 400 } })
      return
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = userRepo.create({ email, password: hashed, name, phone_num })
    await userRepo.save(user)
    const { password: _, ...result } = user
    res.status(201).json(result)
  } catch (err) {
    res.status(422).json({ error: { code: "VALIDATION_ERROR", message: "невалидные данные", status: 422 } })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const user = await userRepo.findOne({ where: { email } })
    if (!user) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "неверный email или пароль", status: 401 } })
      return
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "неверный email или пароль", status: 401 } })
      return
    }
    const payload = { user_id: user.user_id, email: user.email }
    const access_token = jwt.sign(payload, secret, { expiresIn: "1h" })
    const refresh_token = jwt.sign(payload, secret, { expiresIn: "7d" })
    res.json({ access_token, refresh_token, expires_in: 3600 })
  } catch (err) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "ошибка сервера", status: 500 } })
  }
}

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body
    const decoded = jwt.verify(refresh_token, secret) as { user_id: number; email: string }
    const payload = { user_id: decoded.user_id, email: decoded.email }
    const access_token = jwt.sign(payload, secret, { expiresIn: "1h" })
    const new_refresh = jwt.sign(payload, secret, { expiresIn: "7d" })
    res.json({ access_token, refresh_token: new_refresh, expires_in: 3600 })
  } catch (err) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "токен невалиден", status: 401 } })
  }
}