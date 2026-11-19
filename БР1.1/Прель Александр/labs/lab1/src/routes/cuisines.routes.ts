import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Cuisine } from "../entities";
import { asyncHandler } from "../utils/async-handler";
import { toCuisineResponse } from "../utils/serializers";

export const cuisinesRouter = Router();

cuisinesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const cuisines = await AppDataSource.getRepository(Cuisine).find({
      order: { name: "ASC" },
    });

    res.json({ items: cuisines.map(toCuisineResponse) });
  }),
);
