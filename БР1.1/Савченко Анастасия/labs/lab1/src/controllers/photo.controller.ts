import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { RestaurantPhoto } from "../models/restaurant-photo.entity"

const photoRepo = AppDataSource.getRepository(RestaurantPhoto)

export const list = async (req: Request, res: Response) => {
  const data = await photoRepo.find({ where: { restaurant_id: +req.params.restaurant_id }, order: { display_order: "ASC" } })
  res.json({ data: data.map(p => ({ photo_id: p.photo_id, photo_url: p.photo_url, is_main: p.display_order === 0, alt_text: p.alt_text })) })
}

export const create = async (req: Request, res: Response) => {
  const { photo_url, is_main, alt_text } = req.body
  const photo = photoRepo.create({ restaurant_id: +req.params.restaurant_id, photo_url, display_order: is_main ? 0 : 1, alt_text })
  await photoRepo.save(photo)
  res.status(201).json({ photo_id: photo.photo_id, restaurant_id: photo.restaurant_id, photo_url: photo.photo_url, is_main: photo.display_order === 0, alt_text: photo.alt_text })
}

export const remove = async (req: Request, res: Response) => {
  const photo = await photoRepo.findOne({ where: { photo_id: +req.params.photo_id } })
  if (!photo) { res.status(404).json({ error: { code: "NOT_FOUND", message: "фото не найдено", status: 404 } }); return }
  await photoRepo.remove(photo)
  res.status(204).send()
}