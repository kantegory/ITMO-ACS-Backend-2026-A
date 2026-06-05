import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Property } from "../entities/Property";
import { parsePagination, buildPageResponse } from "../utils/pagination";
import { toProperty } from "../utils/mappers";

export const getMyProperties = async (req: Request, res: Response) => {
  const { page, size, skip } = parsePagination(req.query);
  const [rows, total] = await AppDataSource.getRepository(Property).findAndCount({
    where: { ownerId: req.user!.sub },
    order: { createdAt: "DESC" },
    skip,
    take: size,
    relations: ["propertyType", "location", "amenities"],
  });
  res.json(buildPageResponse(rows.map(toProperty), total, page, size));
};
