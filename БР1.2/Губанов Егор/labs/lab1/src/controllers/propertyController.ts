import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Property } from "../entities/Property";
import { PropertyType } from "../entities/PropertyType";
import { Photo } from "../entities/Photo";
import { RentalCondition } from "../entities/RentalCondition";
import { User } from "../entities/User";
import { E } from "../http/errors";
import { propertyShort, propertyDetail, photoOut, conditionOut } from "../serializers";

function canManage(user: User, property: Property) {
  return user.role === "ADMIN" || property.ownerId === user.id;
}

function isLandlord(user: User) {
  return user.role === "OWNER" || user.role === "ADMIN";
}

async function loadPropertyFull(id: string) {
  const repo = AppDataSource.getRepository(Property);
  const p = await repo.findOne({
    where: { id },
    relations: ["owner", "photos", "conditions", "type"],
  });
  return p;
}

export async function listPublic(req: Request, res: Response) {
  const q = req.query;
  const page = Math.max(1, parseInt(String(q.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(q.page_size ?? "20"), 10) || 20)
  );
  const qb = AppDataSource.getRepository(Property)
    .createQueryBuilder("p")
    .innerJoinAndSelect("p.type", "type")
    .where("p.is_published = true")
    .andWhere("type.is_published = true");
  const typeId = q.type_id ? String(q.type_id) : "";
  if (typeId) qb.andWhere("p.type_id = :typeId", { typeId });
  const city = q.city ? String(q.city) : "";
  if (city) qb.andWhere("LOWER(p.city) LIKE LOWER(:city)", { city: `%${city}%` });
  const minP = q.min_price != null ? parseFloat(String(q.min_price)) : NaN;
  if (!Number.isNaN(minP)) qb.andWhere("CAST(p.price AS DECIMAL) >= :minP", { minP });
  const maxP = q.max_price != null ? parseFloat(String(q.max_price)) : NaN;
  if (!Number.isNaN(maxP)) qb.andWhere("CAST(p.price AS DECIMAL) <= :maxP", { maxP });
  const total = await qb.getCount();
  const items = await qb
    .orderBy("p.created_at", "DESC")
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getMany();
  res.json({
    items: items.map(propertyShort),
    total,
  });
}

export async function getPublic(req: Request, res: Response) {
  const p = await loadPropertyFull(req.params.id);
  if (!p || !p.isPublished || !p.type.isPublished) throw E.notFound();
  res.json(propertyDetail(p));
}

export async function create(req: Request, res: Response) {
  const user = req.user!;
  if (!isLandlord(user)) throw E.forbidden();
  const b = req.body as Record<string, unknown>;
  const type_id = String(b.type_id || "");
  const title = String(b.title || "").trim();
  const city = String(b.city || "").trim();
  const address = String(b.address || "").trim();
  const description = String(b.description || "");
  const price = Number(b.price);
  const is_published = Boolean(b.is_published);
  if (!type_id || !title || !city || !address) throw E.validation();
  if (Number.isNaN(price) || price < 0) throw E.validation();
  const typeRepo = AppDataSource.getRepository(PropertyType);
  const t = await typeRepo.findOne({ where: { id: type_id } });
  if (!t) throw E.notFound();
  const repo = AppDataSource.getRepository(Property);
  const p = repo.create({
    ownerId: user.id,
    typeId: type_id,
    title,
    city,
    address,
    description,
    price: price.toFixed(2),
    isPublished: is_published,
  });
  await repo.save(p);
  const full = await loadPropertyFull(p.id);
  res.json(propertyDetail(full!));
}

export async function update(req: Request, res: Response) {
  const user = req.user!;
  const p = await loadPropertyFull(req.params.id);
  if (!p) throw E.notFound();
  if (!canManage(user, p)) throw E.forbidden();
  const b = req.body as Record<string, unknown>;
  if (b.type_id != null) {
    const tid = String(b.type_id);
    const t = await AppDataSource.getRepository(PropertyType).findOne({
      where: { id: tid },
    });
    if (!t) throw E.notFound();
    p.typeId = tid;
  }
  if (b.title != null) p.title = String(b.title).trim();
  if (b.city != null) p.city = String(b.city).trim();
  if (b.address != null) p.address = String(b.address).trim();
  if (b.description != null) p.description = String(b.description);
  if (b.price != null) {
    const pr = Number(b.price);
    if (Number.isNaN(pr) || pr < 0) throw E.validation();
    p.price = pr.toFixed(2);
  }
  if (b.is_published != null) p.isPublished = Boolean(b.is_published);
  await AppDataSource.getRepository(Property).save(p);
  const full = await loadPropertyFull(p.id);
  res.json(propertyDetail(full!));
}

export async function remove(req: Request, res: Response) {
  const user = req.user!;
  const p = await loadPropertyFull(req.params.id);
  if (!p) throw E.notFound();
  if (!canManage(user, p)) throw E.forbidden();
  await AppDataSource.getRepository(Property).remove(p);
  res.status(204).send();
}

export async function addPhoto(req: Request, res: Response) {
  const user = req.user!;
  const p = await loadPropertyFull(req.params.propertyId);
  if (!p) throw E.notFound();
  if (!canManage(user, p)) throw E.forbidden();
  const b = req.body as Record<string, unknown>;
  const photo_url = String(b.photo_url || "").trim();
  const is_main = Boolean(b.is_main);
  if (!photo_url) throw E.validation();
  const repo = AppDataSource.getRepository(Photo);
  if (is_main) {
    await repo.update({ propertyId: p.id }, { isMain: false });
  }
  const ph = repo.create({
    propertyId: p.id,
    photoUrl: photo_url,
    isMain: is_main,
  });
  await repo.save(ph);
  res.json(photoOut(ph));
}

export async function addCondition(req: Request, res: Response) {
  const user = req.user!;
  const p = await loadPropertyFull(req.params.propertyId);
  if (!p) throw E.notFound();
  if (!canManage(user, p)) throw E.forbidden();
  const b = req.body as Record<string, unknown>;
  const text = String(b.text || "").trim();
  if (!text) throw E.validation();
  let sort_order = b.sort_order != null ? parseInt(String(b.sort_order), 10) : NaN;
  const repo = AppDataSource.getRepository(RentalCondition);
  if (Number.isNaN(sort_order)) {
    const raw = await repo
      .createQueryBuilder("c")
      .select("COALESCE(MAX(c.sort_order), -1)", "mx")
      .where("c.property_id = :pid", { pid: p.id })
      .getRawOne();
    sort_order = (parseInt(String(raw?.mx), 10) || -1) + 1;
  }
  const c = repo.create({
    propertyId: p.id,
    text,
    sortOrder: sort_order,
  });
  await repo.save(c);
  res.json(conditionOut(c));
}

export async function deletePhoto(req: Request, res: Response) {
  const user = req.user!;
  const repo = AppDataSource.getRepository(Photo);
  const ph = await repo.findOne({
    where: { id: req.params.id },
    relations: ["property"],
  });
  if (!ph) throw E.notFound();
  if (!canManage(user, ph.property)) throw E.forbidden();
  await repo.remove(ph);
  res.status(204).send();
}

export async function deleteCondition(req: Request, res: Response) {
  const user = req.user!;
  const repo = AppDataSource.getRepository(RentalCondition);
  const c = await repo.findOne({
    where: { id: req.params.id },
    relations: ["property"],
  });
  if (!c) throw E.notFound();
  if (!canManage(user, c.property)) throw E.forbidden();
  await repo.remove(c);
  res.status(204).send();
}
