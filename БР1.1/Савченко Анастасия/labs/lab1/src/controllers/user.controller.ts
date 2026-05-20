import { Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../models/user.entity"

const userRepo = AppDataSource.getRepository(User)

export const getProfile = async (req: any, res: Response) => {
  const user = await userRepo.findOne({ where: { user_id: req.user.user_id } })
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "юзер не найден", status: 404 } })
    return
  }
  const { password: _, ...result } = user
  res.json(result)
}

export const updateProfile = async (req: any, res: Response) => {
  const { name, phone_num } = req.body
  await userRepo.update(req.user.user_id, { name, phone_num })
  const updated = await userRepo.findOne({ where: { user_id: req.user.user_id } })
  const { password: _, ...result } = updated!
  res.json(result)
}