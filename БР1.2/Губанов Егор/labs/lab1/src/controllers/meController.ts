import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Property } from "../entities/Property";
import { Deal } from "../entities/Deal";
import { userPublic, propertyShort, dealOut } from "../serializers";

export async function profile(req: Request, res: Response) {
  res.json(userPublic(req.user!));
}

export async function renting(req: Request, res: Response) {
  const uid = req.user!.id;
  const repo = AppDataSource.getRepository(Deal);
  const items = await repo.find({
    where: { tenantId: uid },
    relations: ["property"],
    order: { createdAt: "DESC" },
  });
  res.json({
    items: items.map((d) => dealOut(d, d.property)),
    total: items.length,
  });
}

export async function owning(req: Request, res: Response) {
  const uid = req.user!.id;
  const propRepo = AppDataSource.getRepository(Property);
  const props = await propRepo.find({
    where: { ownerId: uid },
    order: { createdAt: "DESC" },
  });
  const dealRepo = AppDataSource.getRepository(Deal);
  const rows = [];
  for (const p of props) {
    const active_deals = await dealRepo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.property", "property")
      .where("d.property_id = :pid", { pid: p.id })
      .andWhere("d.status IN (:...st)", { st: ["PENDING", "ACTIVE"] })
      .getMany();
    rows.push({
      property: propertyShort(p),
      active_deals: active_deals.map((d) => dealOut(d, d.property)),
    });
  }
  res.json({ items: rows, total: rows.length });
}

export async function owningDeals(req: Request, res: Response) {
  const uid = req.user!.id;
  const propRepo = AppDataSource.getRepository(Property);
  const props = await propRepo.find({ where: { ownerId: uid } });
  const ids = props.map((p) => p.id);
  if (ids.length === 0) {
    res.json({ items: [], total: 0 });
    return;
  }
  const dealRepo = AppDataSource.getRepository(Deal);
  const items = await dealRepo
    .createQueryBuilder("d")
    .leftJoinAndSelect("d.property", "property")
    .where("d.property_id IN (:...ids)", { ids })
    .orderBy("d.created_at", "DESC")
    .getMany();
  res.json({
    items: items.map((d) => dealOut(d, d.property)),
    total: items.length,
  });
}
