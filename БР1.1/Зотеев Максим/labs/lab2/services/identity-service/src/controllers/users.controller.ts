import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { badRequest, notFound } from "../utils/errors";
import { toUser } from "../utils/mappers";

const repo = () => AppDataSource.getRepository(User);

const loadUser = async (id: string) => {
  const user = await repo().findOne({ where: { id } });
  if (!user) throw notFound("Пользователь не найден");
  return user;
};

export const getMe = async (req: Request, res: Response) => {
  res.json(toUser(await loadUser(req.user!.sub)));
};

export const updateMe = async (req: Request, res: Response) => {
  const user = await loadUser(req.user!.sub);
  const { name, phone } = req.body ?? {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) throw badRequest("Некорректное имя");
    user.name = name;
  }
  if (phone !== undefined) user.phone = phone;
  await repo().save(user);
  res.json(toUser(user));
};

export const getInternalUser = async (req: Request, res: Response) => {
  res.json(toUser(await loadUser(req.params.userId)));
};

export const batchGetInternalUsers = async (req: Request, res: Response) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || !ids.length) throw badRequest("ids обязательно, должно быть непустым массивом");
  const list = await repo().find({ where: { id: In(ids.map(String)) } });
  res.json({ items: list.map(toUser) });
};
