import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Rental } from "../entities/Rental";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { badRequest, forbidden, notFound } from "../utils/errors";
import { toMessage } from "../utils/mappers";
import { parsePagination, buildPageResponse } from "../utils/pagination";

const messagesRepo = () => AppDataSource.getRepository(Message);
const rentalsRepo = () => AppDataSource.getRepository(Rental);

const loadRentalForAccess = async (id: string) => {
  const r = await rentalsRepo()
    .createQueryBuilder("r")
    .leftJoinAndSelect("r.property", "property")
    .leftJoinAndSelect("property.owner", "owner")
    .leftJoinAndSelect("r.tenant", "tenant")
    .where("r.id = :id", { id })
    .getOne();
  if (!r) throw notFound("Сделка не найдена");
  return r;
};

const ensureAccess = (r: Rental, userId: string) => {
  if (String(r.tenant.id) !== userId && String(r.property.owner.id) !== userId) {
    throw forbidden("Нет доступа к сообщениям этой сделки");
  }
};

export const getRentalMessages = async (req: Request, res: Response) => {
  const r = await loadRentalForAccess(req.params.id);
  ensureAccess(r, req.user!.sub);
  const { page, size, skip } = parsePagination(req.query);
  const [rows, total] = await messagesRepo().findAndCount({
    where: { rental: { id: r.id } },
    order: { createdAt: "ASC" },
    skip,
    take: size,
    relations: ["sender"],
  });
  res.json(buildPageResponse(rows.map(toMessage), total, page, size));
};

export const sendMessage = async (req: Request, res: Response) => {
  const r = await loadRentalForAccess(req.params.id);
  ensureAccess(r, req.user!.sub);
  const { body } = req.body ?? {};
  if (!body || typeof body !== "string" || !body.trim()) throw badRequest("Пустое сообщение", "empty_body");
  const sender = await AppDataSource.getRepository(User).findOne({ where: { id: req.user!.sub } });
  const msg = messagesRepo().create({ rental: r, sender: sender!, body });
  await messagesRepo().save(msg);
  res.status(201).json(toMessage(msg));
};
