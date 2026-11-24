import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../data-source";
import { Deal } from "../entities/Deal";
import { ownerPropertyIds, enrichDeal } from "../catalogHelper";
import { dealOut } from "../serializers";

export async function userDealsHistory(req: Request, res: Response) {
  const userId = req.params.userId;
  const limit = Math.min(
    200,
    parseInt(String(req.query.limit || "200"), 10) || 200
  );
  const repo = AppDataSource.getRepository(Deal);
  const asTenant = await repo.find({
    where: { tenantId: userId },
    order: { createdAt: "DESC" },
    take: limit,
  });
  const propIds = await ownerPropertyIds(userId);
  let asOwner: Deal[] = [];
  if (propIds.length) {
    asOwner = await repo
      .createQueryBuilder("d")
      .where("d.propertyId IN (:...propIds)", { propIds })
      .orderBy("d.createdAt", "DESC")
      .take(limit)
      .getMany();
  }
  const map = new Map<string, Deal>();
  for (const d of [...asTenant, ...asOwner]) map.set(d.id, d);
  const merged = [...map.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const items = [];
  for (const d of merged.slice(0, limit)) {
    items.push(dealOut(d, await enrichDeal(d)));
  }
  res.json({ items });
}

export async function ownerActiveDeals(req: Request, res: Response) {
  const ownerId = req.params.ownerId;
  const propIds = await ownerPropertyIds(ownerId);
  const by_property: Record<string, unknown[]> = {};
  const repo = AppDataSource.getRepository(Deal);
  for (const pid of propIds) {
    const deals = await repo.find({
      where: { propertyId: pid, status: In(["PENDING", "ACTIVE"]) },
      order: { createdAt: "DESC" },
    });
    const out = [];
    for (const d of deals) {
      out.push(dealOut(d, await enrichDeal(d)));
    }
    by_property[pid] = out;
  }
  res.json({ by_property });
}
