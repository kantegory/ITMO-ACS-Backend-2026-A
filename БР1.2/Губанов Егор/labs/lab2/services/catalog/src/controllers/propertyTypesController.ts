import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PropertyType } from "../entities/PropertyType";
import { propertyTypeOut } from "../serializers";

export async function list(_req: Request, res: Response) {
  const rows = await AppDataSource.getRepository(PropertyType).find({
    where: { isPublished: true },
    order: { title: "ASC" },
  });
  res.json(rows.map(propertyTypeOut));
}
