import { Request, Response } from "express"

export const list = async (req: Request, res: Response) => {
  res.json({ data: [] })
}

export const details = async (req: Request, res: Response) => {
  res.json({ ok: true })
}