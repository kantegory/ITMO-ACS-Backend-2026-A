import { Request, Response } from "express";
import { Brackets } from "typeorm";
import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message";
import { E } from "../../../../packages/shared/src/errors";
import {
  getUserBrief,
  getPropertySnapshot,
} from "../../../../packages/shared/src/clients";
import { messageOut } from "../serializers";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function list(req: Request, res: Response) {
  const user = req.authUser!;
  const q = req.query;
  const page = Math.max(1, parseInt(String(q.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.page_size ?? "20"), 10) || 20)
  );
  const property_id = q.property_id ? String(q.property_id) : "";
  if (property_id && !UUID_RE.test(property_id)) throw E.validation();
  const after = q.after ? new Date(String(q.after)) : null;
  const before = q.before ? new Date(String(q.before)) : null;
  const order =
    String(q.order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  if (after && Number.isNaN(after.getTime())) throw E.validation();
  if (before && Number.isNaN(before.getTime())) throw E.validation();
  const qb = AppDataSource.getRepository(Message)
    .createQueryBuilder("m")
    .where(
      new Brackets((sub) => {
        sub
          .where("m.senderId = :uid", { uid: user.id })
          .orWhere("m.receiverId = :uid", { uid: user.id });
      })
    );
  if (property_id) qb.andWhere("m.propertyId = :pid", { pid: property_id });
  if (after) qb.andWhere("m.createdAt > :after", { after });
  if (before) qb.andWhere("m.createdAt < :before", { before });
  const [items, total] = await qb
    .orderBy("m.createdAt", order as "ASC" | "DESC")
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();
  res.json({ items: items.map(messageOut), total });
}

export async function send(req: Request, res: Response) {
  const user = req.authUser!;
  const b = req.body as Record<string, unknown>;
  const receiver_id = String(b.receiver_id || "");
  const property_id = String(b.property_id || "");
  const content = String(b.content || "").trim();
  if (!receiver_id || !property_id || !content) throw E.validation();
  if (receiver_id === user.id) throw E.forbidden();
  if (!(await getUserBrief(receiver_id))) throw E.notFound();
  if (!(await getPropertySnapshot(property_id))) throw E.notFound();
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
  const user = req.authUser!;
  const m = await AppDataSource.getRepository(Message).findOne({
    where: { id: req.params.id },
  });
  if (!m) throw E.notFound();
  if (m.receiverId !== user.id) throw E.forbidden();
  m.isRead = true;
  await AppDataSource.getRepository(Message).save(m);
  res.json(messageOut(m));
}
