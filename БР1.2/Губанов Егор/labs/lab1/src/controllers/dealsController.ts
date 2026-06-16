import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Deal, DealStatus } from "../entities/Deal";
import { Property } from "../entities/Property";
import { User } from "../entities/User";
import { E } from "../http/errors";
import { dealOut } from "../serializers";

function computeTotal(
  propertyPrice: number,
  start: Date,
  end: Date,
  override?: number
) {
  if (override != null && !Number.isNaN(override)) {
    return Math.round(override * 100) / 100;
  }
  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / 86400000)
  );
  return Math.round(propertyPrice * days * 100) / 100;
}

function canSeeDeal(user: User, d: Deal, prop: Property) {
  return (
    user.role === "ADMIN" ||
    d.tenantId === user.id ||
    prop.ownerId === user.id
  );
}

export async function create(req: Request, res: Response) {
  const user = req.user!;
  if (user.role !== "TENANT" && user.role !== "ADMIN") throw E.forbidden();
  const b = req.body as Record<string, unknown>;
  const property_id = String(b.property_id || "");
  const start_date = b.start_date ? new Date(String(b.start_date)) : null;
  const end_date = b.end_date ? new Date(String(b.end_date)) : null;
  const total_price_raw = b.total_price != null ? Number(b.total_price) : undefined;
  if (!property_id || !start_date || !end_date || Number.isNaN(start_date.getTime()) || Number.isNaN(end_date.getTime()))
    throw E.validation();
  if (end_date <= start_date) throw E.validation();
  const propRepo = AppDataSource.getRepository(Property);
  const property = await propRepo.findOne({
    where: { id: property_id },
    relations: ["type"],
  });
  if (!property || !property.isPublished || !property.type.isPublished)
    throw E.notFound();
  if (property.ownerId === user.id) throw E.forbidden();
  const dealRepo = AppDataSource.getRepository(Deal);
  const pending = await dealRepo.findOne({
    where: { propertyId: property_id, status: "PENDING" },
  });
  if (pending) throw E.conflict();
  const price = parseFloat(property.price);
  const total = computeTotal(price, start_date, end_date, total_price_raw);
  const d = dealRepo.create({
    propertyId: property_id,
    tenantId: user.id,
    status: "PENDING",
    startDate: start_date,
    endDate: end_date,
    totalPrice: total.toFixed(2),
  });
  await dealRepo.save(d);
  const full = await dealRepo.findOne({
    where: { id: d.id },
    relations: ["property"],
  });
  res.json(dealOut(full!, full!.property));
}

export async function getOne(req: Request, res: Response) {
  const user = req.user!;
  const dealRepo = AppDataSource.getRepository(Deal);
  const d = await dealRepo.findOne({
    where: { id: req.params.id },
    relations: ["property"],
  });
  if (!d) throw E.notFound();
  if (!canSeeDeal(user, d, d.property)) throw E.forbidden();
  res.json(dealOut(d, d.property));
}

export async function patch(req: Request, res: Response) {
  const user = req.user!;
  const b = req.body as Record<string, unknown>;
  const status = b.status as DealStatus | undefined;
  if (!status || !["PENDING", "ACTIVE", "COMPLETED"].includes(status))
    throw E.validation();
  const dealRepo = AppDataSource.getRepository(Deal);
  const d = await dealRepo.findOne({
    where: { id: req.params.id },
    relations: ["property"],
  });
  if (!d) throw E.notFound();
  const prop = d.property;
  if (user.role !== "ADMIN" && prop.ownerId !== user.id) throw E.forbidden();
  const cur = d.status;
  let ok = false;
  if (cur === "PENDING" && (status === "ACTIVE" || status === "COMPLETED")) ok = true;
  if (cur === "ACTIVE" && status === "COMPLETED") ok = true;
  if (!ok) throw E.conflict();
  if (status === "ACTIVE") {
    const active = await dealRepo.findOne({
      where: { propertyId: prop.id, status: "ACTIVE" },
    });
    if (active && active.id !== d.id) throw E.conflict();
  }
  d.status = status;
  await dealRepo.save(d);
  const again = await dealRepo.findOne({
    where: { id: d.id },
    relations: ["property"],
  });
  res.json(dealOut(again!, again!.property));
}
