import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Rental } from "../entities/Rental";
import { badRequest, conflict, forbidden, HttpError, notFound, parseNumericId } from "@rental/shared";
import { toRental } from "../utils/mappers";
import { parsePagination, buildPageResponse } from "../utils/pagination";
import * as propertyClient from "../clients/property";
import * as identityClient from "../clients/identity";
import { publishEvent } from "../messaging/publisher";

const rentalsRepo = () => AppDataSource.getRepository(Rental);

const isParticipant = (r: Rental, userId: string) =>
  String(r.tenantId) === userId || String(r.ownerId) === userId;

const loadRental = async (id: string, name = "rentalId") => {
  const safe = parseNumericId(id, name);
  const r = await rentalsRepo().findOne({ where: { id: safe } });
  if (!r) throw notFound("Сделка не найдена");
  return r;
};

const enrich = async (r: Rental) => {
  const users = await identityClient.batchGetUsers([r.tenantId, r.ownerId]).catch(() => undefined);
  return toRental(r, users);
};

export const createRental = async (req: Request, res: Response) => {
  const propertyId = parseNumericId(req.params.id, "propertyId");
  const ctx = await propertyClient.getRentalContext(propertyId);

  if (!ctx.is_available) throw badRequest("Объект недоступен для аренды", "not_available");
  if (ctx.owner_id === req.user!.sub) {
    throw badRequest("Нельзя арендовать собственный объект", "own_property");
  }

  const { start_date, end_date } = req.body ?? {};
  if (!start_date) throw badRequest("start_date обязателен");

  // Сначала создаём сделку, потом помечаем объект занятым.
  // На случай гонки делаем компенсацию: при 409 от availability — удаляем
  // только что созданную сделку и возвращаем 409 клиенту вместо 500.
  const rental = rentalsRepo().create({
    propertyId,
    tenantId: req.user!.sub,
    ownerId: ctx.owner_id,
    propertyTitleSnapshot: ctx.title,
    propertyCitySnapshot: ctx.city,
    pricePerMonthSnapshot: String(ctx.price_per_month),
    startDate: start_date,
    endDate: end_date ?? null,
    status: "active",
  });
  await rentalsRepo().save(rental);

  try {
    await propertyClient.updateAvailability(propertyId, {
      is_available: false,
      expected_available: true,
      reason: "rental_created",
      rental_id: String(rental.id),
    });
  } catch (e) {
    await rentalsRepo().remove(rental);
    if (e instanceof HttpError && e.status === 409) {
      throw conflict("Объект уже арендуется кем-то другим", "property_taken");
    }
    throw e;
  }

  publishEvent("rental.created", {
    rental_id: String(rental.id),
    property_id: propertyId,
    tenant_id: rental.tenantId,
    owner_id: rental.ownerId,
    property_title: ctx.title,
    occurred_at: new Date().toISOString(),
  });

  res.status(201).json(await enrich(rental));
};

export const getRental = async (req: Request, res: Response) => {
  const r = await loadRental(req.params.id);
  if (!isParticipant(r, req.user!.sub)) throw forbidden("Нет доступа к этой сделке");
  res.json(await enrich(r));
};

// Оптимистично переводим в новый статус. Если уже не active — это конфликт,
// возвращаем 409 вместо неинформативного 400 или 500 в случае гонки.
const transitionStatus = async (id: string, target: "completed" | "cancelled") => {
  const result = await AppDataSource.query(
    `UPDATE rentals
        SET status = $1
      WHERE id = $2 AND status = 'active'
      RETURNING id`,
    [target, id]
  );
  return result.length > 0;
};

export const completeRental = async (req: Request, res: Response) => {
  const r = await loadRental(req.params.id);
  if (String(r.ownerId) !== req.user!.sub) throw forbidden("Только арендодатель может завершать сделки");
  if (r.status !== "active") throw conflict("Сделка уже завершена или отменена", "invalid_status");

  const ok = await transitionStatus(r.id, "completed");
  if (!ok) {
    const fresh = await loadRental(r.id);
    throw conflict(`Сделка уже в статусе ${fresh.status}`, "invalid_status");
  }
  r.status = "completed";

  // Освобождаем объект; 409 (объект уже свободен) трактуем как идемпотентность.
  try {
    await propertyClient.updateAvailability(r.propertyId, {
      is_available: true,
      expected_available: false,
      reason: "rental_completed",
      rental_id: String(r.id),
    });
  } catch (e) {
    if (!(e instanceof HttpError && e.status === 409)) {
      console.warn("Не удалось обновить доступность объекта после complete:", (e as Error).message);
    }
  }

  publishEvent("rental.completed", {
    rental_id: String(r.id),
    property_id: r.propertyId,
    tenant_id: r.tenantId,
    owner_id: r.ownerId,
    occurred_at: new Date().toISOString(),
  });

  res.json(await enrich(r));
};

export const cancelRental = async (req: Request, res: Response) => {
  const r = await loadRental(req.params.id);
  if (!isParticipant(r, req.user!.sub)) throw forbidden("Нет прав на отмену этой сделки");
  if (r.status !== "active") throw conflict("Сделка уже завершена или отменена", "invalid_status");

  const ok = await transitionStatus(r.id, "cancelled");
  if (!ok) {
    const fresh = await loadRental(r.id);
    throw conflict(`Сделка уже в статусе ${fresh.status}`, "invalid_status");
  }
  r.status = "cancelled";

  try {
    await propertyClient.updateAvailability(r.propertyId, {
      is_available: true,
      expected_available: false,
      reason: "rental_cancelled",
      rental_id: String(r.id),
    });
  } catch (e) {
    if (!(e instanceof HttpError && e.status === 409)) {
      console.warn("Не удалось обновить доступность объекта после cancel:", (e as Error).message);
    }
  }

  publishEvent("rental.cancelled", {
    rental_id: String(r.id),
    property_id: r.propertyId,
    tenant_id: r.tenantId,
    owner_id: r.ownerId,
    occurred_at: new Date().toISOString(),
  });

  res.json(await enrich(r));
};

export const getMyRentals = async (req: Request, res: Response) => {
  const { page, size, skip } = parsePagination(req.query);
  const status = req.query.status as string | undefined;
  const uid = req.user!.sub;

  const qb = rentalsRepo()
    .createQueryBuilder("r")
    .where("(r.tenantId = :uid OR r.ownerId = :uid)", { uid })
    .orderBy("r.createdAt", "DESC")
    .skip(skip)
    .take(size);
  if (status) qb.andWhere("r.status = :status", { status });

  const [rows, total] = await qb.getManyAndCount();

  const userIds = new Set<string>();
  for (const r of rows) {
    userIds.add(String(r.tenantId));
    userIds.add(String(r.ownerId));
  }
  const users = await identityClient.batchGetUsers(Array.from(userIds)).catch(() => undefined);

  res.json(buildPageResponse(rows.map((r) => toRental(r, users)), total, page, size));
};
