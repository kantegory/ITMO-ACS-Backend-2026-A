import { Request, Response } from "express"
import { AppDataSource } from "../data-source"
import { Table } from "../models/table.entity"
import { Booking } from "../models/booking.entity"

const tableRepo = AppDataSource.getRepository(Table)
const bookingRepo = AppDataSource.getRepository(Booking)

export const list = async (req: Request, res: Response) => {
  const data = await tableRepo.find({ where: { restaurant_id: +req.params.restaurant_id } })
  res.json({ data })
}

export const available = async (req: Request, res: Response) => {
  const { date, reservation_start, reservation_end, party_size } = req.query
  const busy = await bookingRepo.createQueryBuilder("b")
    .select("b.table_id").where("b.date = :date", { date })
    .andWhere("b.state IN (:...states)", { states: ["pending", "confirmed"] })
    .andWhere("b.reservation_start < :end", { end: reservation_end })
    .andWhere("b.reservation_end > :start", { start: reservation_start }).getMany()
  const busyIds = busy.map(b => b.table_id)
  const qb = tableRepo.createQueryBuilder("t").where("t.restaurant_id = :rid", { rid: +req.params.restaurant_id }).andWhere("t.is_available = true")
  if (busyIds.length) qb.andWhere("t.table_id NOT IN (:...busyIds)", { busyIds })
  if (party_size) qb.andWhere("t.capacity >= :ps", { ps: +party_size })
  res.json({ data: await qb.getMany() })
}