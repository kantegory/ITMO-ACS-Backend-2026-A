import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Deal, DealStatus } from "../entities/Deal";
import { E } from "../../../../packages/shared/src/errors";
import { AuthUser } from "../../../../packages/shared/src/types";
import { getPropertySnapshot } from "../../../../packages/shared/src/clients";
import { enrichDeal, ownerPropertyIds } from "../catalogHelper";
import { dealOut } from "../serializers";
import { publishDealEvent } from "../../../../packages/shared/src/mq";

async function emitDealEvent(event: Parameters<typeof publishDealEvent>[0]) {
  try {
    await publishDealEvent(event);
  } catch (e) {
    console.error("rabbitmq publish failed", e);
  }
}

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

async function canSeeDeal(user: AuthUser, d: Deal, ownerId: string) {
  return user.role === "ADMIN" || d.tenantId === user.id || ownerId === user.id;
}

export async function create(req: Request, res: Response) {
  const user = req.authUser!;
  if (user.role !== "TENANT" && user.role !== "ADMIN") throw E.forbidden();
  const b = req.body as Record<string, unknown>;
  const property_id = String(b.property_id || "");
  const start_date = b.start_date ? new Date(String(b.start_date)) : null;
  const end_date = b.end_date ? new Date(String(b.end_date)) : null;
  const total_price_raw =
    b.total_price != null ? Number(b.total_price) : undefined;
  if (
    !property_id ||
    !start_date ||
    !end_date ||
    Number.isNaN(start_date.getTime()) ||
    Number.isNaN(end_date.getTime())
  )
    throw E.validation();
  if (end_date <= start_date) throw E.validation();
  const property = await getPropertySnapshot(property_id);
  if (
    !property ||
    !property.is_published ||
    !property.type_is_published
  )
    throw E.notFound();
  if (property.owner_id === user.id) throw E.forbidden();
  const dealRepo = AppDataSource.getRepository(Deal);
  await dealRepo.delete({ propertyId: property_id, status: "PENDING" });
  const total = computeTotal(
    property.price,
    start_date,
    end_date,
    total_price_raw
  );
  const d = dealRepo.create({
    propertyId: property_id,
    tenantId: user.id,
    status: "PENDING",
    startDate: start_date,
    endDate: end_date,
    totalPrice: total.toFixed(2),
  });
  await dealRepo.save(d);
  await emitDealEvent({
    type: "deal.created",
    deal_id: d.id,
    property_id: property_id,
    tenant_id: user.id,
    owner_id: property.owner_id,
    start_date: start_date.toISOString(),
    end_date: end_date.toISOString(),
    total_price: d.totalPrice,
  });
  res.json(dealOut(d, property));
}

export async function getOne(req: Request, res: Response) {
  const user = req.authUser!;
  const d = await AppDataSource.getRepository(Deal).findOne({
    where: { id: req.params.id },
  });
  if (!d) throw E.notFound();
  const property = await getPropertySnapshot(d.propertyId);
  if (!property) throw E.notFound();
  if (!(await canSeeDeal(user, d, property.owner_id))) throw E.forbidden();
  res.json(dealOut(d, property));
}

export async function patch(req: Request, res: Response) {
  const user = req.authUser!;
  const status = (req.body as Record<string, unknown>).status as
    | DealStatus
    | undefined;
  if (!status || !["PENDING", "ACTIVE", "COMPLETED"].includes(status))
    throw E.validation();
  const dealRepo = AppDataSource.getRepository(Deal);
  const d = await dealRepo.findOne({ where: { id: req.params.id } });
  if (!d) throw E.notFound();
  const property = await getPropertySnapshot(d.propertyId);
  if (!property) throw E.notFound();
  if (user.role !== "ADMIN" && property.owner_id !== user.id)
    throw E.forbidden();
  const cur = d.status;
  let ok = false;
  if (cur === "PENDING" && (status === "ACTIVE" || status === "COMPLETED"))
    ok = true;
  if (cur === "ACTIVE" && status === "COMPLETED") ok = true;
  if (!ok) throw E.conflict();
  if (status === "ACTIVE") {
    const others = await dealRepo.find({
      where: { propertyId: d.propertyId, status: "ACTIVE" },
    });
    for (const other of others) {
      if (other.id !== d.id) {
        other.status = "COMPLETED";
        await dealRepo.save(other);
      }
    }
  }
  const previous_status = d.status;
  d.status = status;
  await dealRepo.save(d);
  await emitDealEvent({
    type: "deal.status_changed",
    deal_id: d.id,
    property_id: d.propertyId,
    tenant_id: d.tenantId,
    owner_id: property.owner_id,
    status,
    previous_status,
  });
  res.json(dealOut(d, property));
}

export async function renting(req: Request, res: Response) {
  const uid = req.authUser!.id;
  const items = await AppDataSource.getRepository(Deal).find({
    where: { tenantId: uid },
    order: { createdAt: "DESC" },
  });
  const out = [];
  for (const d of items) {
    const p = await enrichDeal(d);
    out.push(dealOut(d, p));
  }
  res.json({ items: out, total: out.length });
}

export async function owningDeals(req: Request, res: Response) {
  const uid = req.authUser!.id;
  const propIds = await ownerPropertyIds(uid);
  if (propIds.length === 0) {
    res.json({ items: [], total: 0 });
    return;
  }
  const items = await AppDataSource.getRepository(Deal)
    .createQueryBuilder("d")
    .where("d.propertyId IN (:...ids)", { ids: propIds })
    .orderBy("d.createdAt", "DESC")
    .getMany();
  const out = [];
  for (const d of items) {
    out.push(dealOut(d, await enrichDeal(d)));
  }
  res.json({ items: out, total: out.length });
}
