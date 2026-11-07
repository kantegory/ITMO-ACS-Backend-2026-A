import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { Rental } from "../entities/Rental";
import { notFound, badRequest } from "../utils/errors";
import { toUser, toProperty, toRental } from "../utils/mappers";
import { parsePagination, buildPageResponse } from "../utils/pagination";

const loadUser = async (id: string) => {
  const user = await AppDataSource.getRepository(User).findOne({ where: { id } });
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
  await AppDataSource.getRepository(User).save(user);
  res.json(toUser(user));
};

export const getMyProperties = async (req: Request, res: Response) => {
  const { page, size, skip } = parsePagination(req.query);
  const [rows, total] = await AppDataSource.getRepository(Property).findAndCount({
    where: { owner: { id: req.user!.sub } },
    order: { createdAt: "DESC" },
    skip,
    take: size,
  });
  res.json(buildPageResponse(rows.map(toProperty), total, page, size));
};

export const getMyRentals = async (req: Request, res: Response) => {
  const { page, size, skip } = parsePagination(req.query);
  const status = req.query.status as string | undefined;
  const qb = AppDataSource.getRepository(Rental)
    .createQueryBuilder("r")
    .leftJoinAndSelect("r.property", "property")
    .leftJoinAndSelect("property.propertyType", "ptype")
    .leftJoinAndSelect("property.location", "location")
    .leftJoinAndSelect("property.amenities", "amenities")
    .leftJoin("property.owner", "owner")
    .leftJoinAndSelect("r.tenant", "tenant")
    .where("(tenant.id = :uid OR owner.id = :uid)", { uid: req.user!.sub })
    .orderBy("r.createdAt", "DESC")
    .skip(skip)
    .take(size);
  if (status) qb.andWhere("r.status = :status", { status });
  const [rows, total] = await qb.getManyAndCount();
  res.json(buildPageResponse(rows.map(toRental), total, page, size));
};
