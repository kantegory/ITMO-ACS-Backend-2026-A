import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { PropertyType } from "../entities/PropertyType";
import { Amenity } from "../entities/Amenity";
import { toAmenity } from "../utils/mappers";

export const getPropertyTypes = async (_req: Request, res: Response) => {
  const list = await AppDataSource.getRepository(PropertyType).find({ order: { id: "ASC" } });
  res.json(list.map((t) => ({ id: t.id, name: t.name })));
};

export const getAmenities = async (_req: Request, res: Response) => {
  const list = await AppDataSource.getRepository(Amenity).find({ order: { id: "ASC" } });
  res.json(list.map(toAmenity));
};
