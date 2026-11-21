import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Property } from "../entities/Property";
import { E } from "../../../../packages/shared/src/errors";
import { propertyShort, propertySnapshot } from "../serializers";

async function loadWithType(id: string) {
  return AppDataSource.getRepository(Property).findOne({
    where: { id },
    relations: ["type"],
  });
}

export async function getPropertySnapshot(req: Request, res: Response) {
  const p = await loadWithType(req.params.id);
  if (!p) throw E.notFound();
  res.json(propertySnapshot(p));
}

export async function listOwnerProperties(req: Request, res: Response) {
  const rows = await AppDataSource.getRepository(Property).find({
    where: { ownerId: req.params.ownerId },
    order: { createdAt: "DESC" },
  });
  res.json({ items: rows.map(propertyShort) });
}
