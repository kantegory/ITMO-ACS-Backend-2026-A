import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Property } from "../entities/Property";
import { badRequest, conflict, notFound } from "../utils/errors";

const propsRepo = () => AppDataSource.getRepository(Property);

export const getRentalContext = async (req: Request, res: Response) => {
  const p = await propsRepo().findOne({
    where: { id: req.params.propertyId },
    relations: ["propertyType", "location"],
  });
  if (!p) throw notFound("Объект не найден", "property_not_found");
  res.json({
    id: String(p.id),
    owner_id: String(p.ownerId),
    title: p.title,
    city: p.location?.city ?? "",
    district: p.location?.district ?? null,
    address: p.location?.address ?? "",
    property_type: p.propertyType?.name ?? "",
    price_per_month: Number(p.pricePerMonth),
    is_available: p.isAvailable,
  });
};

// Оптимистичная блокировка: меняем доступность только если текущее значение
// совпадает с ожидаемым. Если состояние уже изменено — отдаём 409,
// чтобы вызывающий сервис понял про гонку, а не получил 500.
export const updateAvailability = async (req: Request, res: Response) => {
  const { is_available, expected_available, reason } = req.body ?? {};
  if (typeof is_available !== "boolean" || typeof expected_available !== "boolean") {
    throw badRequest("is_available и expected_available обязательны, тип boolean");
  }
  if (!reason || typeof reason !== "string") {
    throw badRequest("reason обязателен");
  }

  const id = req.params.propertyId;

  const result = await AppDataSource.query(
    `UPDATE properties
       SET is_available = $1
     WHERE id = $2 AND is_available = $3
     RETURNING id, is_available`,
    [is_available, id, expected_available]
  );

  if (result.length === 0) {
    const exists = await propsRepo().findOne({ where: { id } });
    if (!exists) throw notFound("Объект не найден", "property_not_found");
    throw conflict(
      `Состояние объекта уже изменено. Ожидалось is_available=${expected_available}, сейчас is_available=${exists.isAvailable}`,
      "availability_conflict"
    );
  }

  res.json({
    property_id: String(result[0].id),
    is_available: result[0].is_available,
    updated_at: new Date().toISOString(),
  });
};
