import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Rental } from "../entities/Rental";
import { Property } from "../entities/Property";
import { User } from "../entities/User";
import { badRequest, forbidden, notFound } from "../utils/errors";
import { toRental } from "../utils/mappers";

const rentalsRepo = () => AppDataSource.getRepository(Rental);
const propsRepo = () => AppDataSource.getRepository(Property);

const loadRentalWithOwner = async (id: string) => {
  const r = await rentalsRepo()
    .createQueryBuilder("r")
    .leftJoinAndSelect("r.property", "property")
    .leftJoinAndSelect("property.propertyType", "ptype")
    .leftJoinAndSelect("property.location", "location")
    .leftJoinAndSelect("property.amenities", "amenities")
    .leftJoinAndSelect("property.owner", "owner")
    .leftJoinAndSelect("r.tenant", "tenant")
    .where("r.id = :id", { id })
    .getOne();
  if (!r) throw notFound("Сделка не найдена");
  return r;
};

const isParticipant = (r: Rental, userId: string) =>
  String(r.tenant.id) === userId || String(r.property.owner.id) === userId;

export const createRental = async (req: Request, res: Response) => {
  const property = await propsRepo().findOne({
    where: { id: req.params.id },
    relations: ["owner", "propertyType", "location", "amenities"],
  });
  if (!property) throw notFound("Объект не найден");
  if (!property.isAvailable) throw badRequest("Объект недоступен для аренды", "not_available");
  if (String(property.owner.id) === req.user!.sub) {
    throw badRequest("Нельзя арендовать собственный объект", "own_property");
  }

  const { start_date, end_date } = req.body ?? {};
  if (!start_date) throw badRequest("start_date обязателен");
  const tenant = await AppDataSource.getRepository(User).findOne({ where: { id: req.user!.sub } });

  const rental = rentalsRepo().create({
    property,
    tenant: tenant!,
    startDate: start_date,
    endDate: end_date,
    status: "active",
  });
  await rentalsRepo().save(rental);

  const full = await loadRentalWithOwner(rental.id);
  res.status(201).json(toRental(full));
};

export const getRental = async (req: Request, res: Response) => {
  const r = await loadRentalWithOwner(req.params.id);
  if (!isParticipant(r, req.user!.sub)) throw forbidden("Нет доступа к этой сделке");
  res.json(toRental(r));
};

export const completeRental = async (req: Request, res: Response) => {
  const r = await loadRentalWithOwner(req.params.id);
  if (String(r.property.owner.id) !== req.user!.sub) throw forbidden("Только арендодатель может завершать сделки");
  if (r.status !== "active") throw badRequest("Сделка уже завершена или отменена", "invalid_status");
  r.status = "completed";
  await rentalsRepo().save(r);
  res.json(toRental(r));
};

export const cancelRental = async (req: Request, res: Response) => {
  const r = await loadRentalWithOwner(req.params.id);
  if (!isParticipant(r, req.user!.sub)) throw forbidden("Нет прав на отмену этой сделки");
  if (r.status !== "active") throw badRequest("Сделка уже завершена или отменена", "invalid_status");
  r.status = "cancelled";
  await rentalsRepo().save(r);
  res.json(toRental(r));
};
