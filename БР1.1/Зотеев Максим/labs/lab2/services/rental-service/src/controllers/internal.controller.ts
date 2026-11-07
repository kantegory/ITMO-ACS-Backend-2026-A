import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Rental } from "../entities/Rental";
import { notFound, parseNumericId } from "@rental/shared";
import { toInternalRental, toRentalParticipants } from "../utils/mappers";

const repo = () => AppDataSource.getRepository(Rental);

export const getInternalRental = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.rentalId, "rentalId");
  const r = await repo().findOne({ where: { id } });
  if (!r) throw notFound("Сделка не найдена", "rental_not_found");
  res.json(toInternalRental(r));
};

export const getRentalParticipants = async (req: Request, res: Response) => {
  const id = parseNumericId(req.params.rentalId, "rentalId");
  const r = await repo().findOne({ where: { id } });
  if (!r) throw notFound("Сделка не найдена", "rental_not_found");
  res.json(toRentalParticipants(r));
};
