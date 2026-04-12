import { Request, Response } from "express";
import { Brackets } from "typeorm";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { E } from "../http/errors";
import { messageOut } from "../serializers";

export async function list(req: Request, res: Response) {
  const user = req.user!;
  const q = req.query;
  const page = Math.max(1, parseInt(String(q.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.page_size ?? "20"), 10) || 20)
  );
  const property_id = q.property_id ? String(q.property_id) : "";
  const after = q.after ? new Date(String(q.after)) : null;
  const before = q.before ? new Date(String(q.before)) : null;
  const order = String(q.order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  if (after && Number.isNaN(after.getTime())) throw E.validation();
  if (before && Number.isNaN(before.getTime())) throw E.validation();
  const repo = AppDataSource.getRepository(Message);
  const qb = repo
    .createQueryBuilder("m")
    .where(
      new Brackets((q) => {
        q.where("m.senderId = :uid", { uid: user.id }).orWhere(
          "m.receiverId = :uid",
          { uid: user.id }
        );
      })
    );
  if (property_id) qb.andWhere("m.propertyId = :pid", { pid: property_id });
  if (after) qb.andWhere("m.createdAt > :after", { after });
  if (before) qb.andWhere("m.createdAt < :before", { before });
  const total = await qb.getCount();
  const items = await qb
    .orderBy("m.createdAt", order as "ASC" | "DESC")
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getMany();
  res.json({
    items: items.map(messageOut),
    total,
  });
}

export async function send(req: Request, res: Response) {
  const user = req.user!;
  const b = req.body as Record<string, unknown>;
  const receiver_id = String(b.receiver_id || "");
  const property_id = String(b.property_id || "");
  const content = String(b.content || "").trim();
  if (!receiver_id || !property_id || !content) throw E.validation();
  if (receiver_id === user.id) throw E.forbidden();
  const uRepo = AppDataSource.getRepository(User);
  const receiver = await uRepo.findOne({ where: { id: receiver_id } });
  if (!receiver) throw E.notFound();
  const p = await AppDataSource.getRepository(Property).findOne({
    where: { id: property_id },
  });
  if (!p) throw E.notFound();
  const repo = AppDataSource.getRepository(Message);
  const m = repo.create({
    senderId: user.id,
    receiverId: receiver_id,
    propertyId: property_id,
    content,
    isRead: false,
  });
  await repo.save(m);
  res.json(messageOut(m));
}

export async function markRead(req: Request, res: Response) {
  const user = req.user!;
  const repo = AppDataSource.getRepository(Message);
  const m = await repo.findOne({ where: { id: req.params.id } });
  if (!m) throw E.notFound();
  if (m.receiverId !== user.id) throw E.forbidden();
  m.isRead = true;
  await repo.save(m);
  res.json(messageOut(m));
}
