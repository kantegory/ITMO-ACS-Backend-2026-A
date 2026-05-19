import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Rental } from "../entities/Rental";
import { notFound } from "../utils/errors";
import { toInternalRental, toRentalParticipants } from "../utils/mappers";

const repo = () => AppDataSource.getRepository(Rental);

export const getInternalRental = async (req: Request, res: Response) => {
  const r = await repo().findOne({ where: { id: req.params.rentalId } });
  if (!r) throw notFound("Сделка не найдена", "rental_not_found");
  res.json(toInternalRental(r));
};

export const getRentalParticipants = async (req: Request, res: Response) => {
  const r = await repo().findOne({ where: { id: req.params.rentalId } });
  if (!r) throw notFound("Сделка не найдена", "rental_not_found");
  res.json(toRentalParticipants(r));
};
