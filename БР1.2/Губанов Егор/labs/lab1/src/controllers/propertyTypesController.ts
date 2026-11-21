import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PropertyType } from "../entities/PropertyType";
import { propertyTypeOut } from "../serializers";

export async function list(_req: Request, res: Response) {
  const repo = AppDataSource.getRepository(PropertyType);
  const rows = await repo.find({
    where: { isPublished: true },
    order: { title: "ASC" },
  });
  res.json(rows.map(propertyTypeOut));
}
